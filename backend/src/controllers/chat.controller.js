const Message = require('../models/Message');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const CreatorProfile = require('../models/CreatorProfile');
const CallLog = require('../models/CallLog');
const Transaction = require('../models/Transaction');
const walletService = require('../services/wallet.service');
const awsService = require('../services/aws.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Helper to format paywalled message attachments
const formatMessageForUser = async (user, msg) => {
  const isSender = msg.senderId.toString() === user._id.toString();
  const hasUnlocked = msg.unlockedUsers.includes(user._id);
  const isAdmin = user.role === 'admin';

  let hasAccess = isSender || hasUnlocked || isAdmin || !msg.isPaywall;

  let finalMediaUrl = msg.mediaUrl;
  if (msg.mediaUrl) {
    if (hasAccess) {
      // Generate presigned GET URL
      let key = msg.mediaUrl;
      if (msg.mediaUrl.includes('.amazonaws.com/')) {
        key = msg.mediaUrl.split('.amazonaws.com/')[1];
      }
      try {
        finalMediaUrl = await awsService.getPresignedDownloadUrl(key);
      } catch (err) {
        console.error('[Media Storage] Error presigning message media:', err);
      }
    } else {
      // Mask url
      finalMediaUrl = null;
    }
  }

  return {
    _id: msg._id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    content: msg.content,
    mediaUrl: finalMediaUrl,
    mediaType: msg.mediaType,
    isPaywall: msg.isPaywall,
    coinPrice: msg.coinPrice,
    isLocked: !hasAccess,
    isOpened: msg.isOpened,
    createdAt: msg.createdAt
  };
};

// Retrieve chat threads
// Each conversation carries the peer user, their creator profile (rates/status),
// the last message, unread count, and fan stats so the UI can render the sidebar directly.
exports.getConversations = catchAsync(async (req, res, next) => {
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', req.user._id] },
            '$receiverId',
            '$senderId'
          ]
        },
        lastMessage: { $first: '$$ROOT' }
      }
    }
  ]);

  const populated = await Message.populate(conversations, {
    path: '_id',
    select: 'username displayName avatarUrl role createdAt',
    model: 'User'
  });

  // Unread message counts per peer (messages sent TO the current user, not opened yet)
  const unread = await Message.aggregate([
    { $match: { receiverId: req.user._id, isOpened: false } },
    { $group: { _id: '$senderId', count: { $sum: 1 } } }
  ]);
  const unreadMap = {};
  unread.forEach((u) => { unreadMap[String(u._id)] = u.count; });

  // Creator profiles for peers (rates, verification badge, online status, location)
  const peerIds = populated
    .map((c) => (c._id && c._id._id ? c._id._id : c._id))
    .filter(Boolean);

  const profiles = await CreatorProfile.find({ userId: { $in: peerIds } }).lean();
  const profileMap = {};
  profiles.forEach((p) => { profileMap[String(p.userId)] = p; });

  // User presence & registration dates
  const users = await User.find({ _id: { $in: peerIds } })
    .select('isOnline lastSeenAt createdAt')
    .lean();
  const userPresenceMap = {};
  users.forEach((u) => { userPresenceMap[String(u._id)] = u; });

  // 1. Message counts & earliest message dates per peer
  const messageStats = peerIds.length
    ? await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: req.user._id, receiverId: { $in: peerIds } },
              { senderId: { $in: peerIds }, receiverId: req.user._id }
            ]
          }
        },
        {
          $project: {
            peerId: {
              $cond: [{ $eq: ['$senderId', req.user._id] }, '$receiverId', '$senderId']
            },
            createdAt: 1
          }
        },
        {
          $group: {
            _id: '$peerId',
            count: { $sum: 1 },
            earliestDate: { $min: '$createdAt' }
          }
        }
      ])
    : [];
  const msgStatMap = {};
  messageStats.forEach((m) => {
    msgStatMap[String(m._id)] = { count: m.count, earliestDate: m.earliestDate };
  });

  // 2. Subscriptions (active sub info + earliest sub interaction date per peer)
  const allSubs = peerIds.length
    ? await Subscription.find({
        $or: [
          { userId: req.user._id, creatorId: { $in: peerIds } },
          { userId: { $in: peerIds }, creatorId: req.user._id }
        ]
      }).sort({ createdAt: 1 }).lean()
    : [];

  const subMap = {};
  const subDateMap = {};
  allSubs.forEach((s) => {
    const peerKey = String(s.userId.toString() === req.user._id.toString() ? s.creatorId : s.userId);
    if (!subDateMap[peerKey]) {
      subDateMap[peerKey] = s.createdAt;
    }
    if ((s.status === 'active' || s.status === 'expiring') && new Date(s.expiryDate) > new Date()) {
      subMap[peerKey] = s;
    }
  });

  // 3. CallLogs earliest date per peer
  const callStats = peerIds.length
    ? await CallLog.aggregate([
        {
          $match: {
            $or: [
              { callerId: req.user._id, receiverId: { $in: peerIds } },
              { callerId: { $in: peerIds }, receiverId: req.user._id }
            ]
          }
        },
        {
          $project: {
            peerId: {
              $cond: [{ $eq: ['$callerId', req.user._id] }, '$receiverId', '$callerId']
            },
            createdAt: 1
          }
        },
        {
          $group: {
            _id: '$peerId',
            earliestDate: { $min: '$createdAt' }
          }
        }
      ])
    : [];
  const callDateMap = {};
  callStats.forEach((c) => {
    callDateMap[String(c._id)] = c.earliestDate;
  });

  // 4. Transactions (Total spent, total gifts/tips, earliest transaction date per peer)
  const txStats = peerIds.length
    ? await Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            $or: [
              { senderId: req.user._id, receiverId: { $in: peerIds } },
              { senderId: { $in: peerIds }, receiverId: req.user._id }
            ]
          }
        },
        {
          $project: {
            senderId: 1,
            receiverId: 1,
            type: 1,
            amountCoins: 1,
            createdAt: 1,
            peerId: {
              $cond: [{ $eq: ['$senderId', req.user._id] }, '$receiverId', '$senderId']
            }
          }
        },
        {
          $group: {
            _id: '$peerId',
            earliestDate: { $min: '$createdAt' },
            totalSpentCoins: {
              $sum: {
                $cond: [{ $ne: ['$senderId', req.user._id] }, '$amountCoins', 0]
              }
            },
            totalTipsCoins: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$senderId', req.user._id] },
                      { $in: ['$type', ['tip', 'gift']] }
                    ]
                  },
                  '$amountCoins',
                  0
                ]
              }
            }
          }
        }
      ])
    : [];
  const txStatMap = {};
  txStats.forEach((t) => {
    txStatMap[String(t._id)] = {
      earliestDate: t.earliestDate,
      totalSpentCoins: t.totalSpentCoins || 0,
      totalTipsCoins: t.totalTipsCoins || 0
    };
  });

  // Active call status
  const activeCalls = peerIds.length
    ? await CallLog.find({
        status: 'active',
        $or: [{ callerId: { $in: peerIds } }, { receiverId: { $in: peerIds } }]
      }).select('callerId receiverId').lean()
    : [];
  const busyIds = new Set();
  activeCalls.forEach((c) => {
    busyIds.add(c.callerId.toString());
    busyIds.add(c.receiverId.toString());
  });

  populated.forEach((c) => {
    const peerId = String(c._id && c._id._id ? c._id._id : c._id);
    c.unreadCount = unreadMap[peerId] || 0;
    const profile = profileMap[peerId] || null;
    const u = userPresenceMap[peerId] || null;

    if (profile) {
      profile.isOnline = profile.showOnlineStatus !== false && !!profile.isOnline;
      profile.isBusy = busyIds.has(peerId);
      c.profile = profile;
    } else {
      c.profile = u
        ? {
            isOnline: !!u.isOnline,
            isBusy: busyIds.has(peerId),
            lastSeenAt: u.lastSeenAt || null
          }
        : null;
    }

    const liveSub = subMap[peerId];
    c.subscription = liveSub
      ? {
          status: 'ACTIVE',
          plan: liveSub.plan || 'Premium',
          since: liveSub.createdAt ? new Date(liveSub.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
          renewalDate: liveSub.expiryDate || null
        }
      : {
          status: 'INACTIVE',
          plan: 'Free',
          since: '—',
          renewalDate: null
        };

    const mStat = msgStatMap[peerId] || {};
    const tStat = txStatMap[peerId] || {};

    const rawDates = [
      mStat.earliestDate,
      subDateMap[peerId],
      callDateMap[peerId],
      tStat.earliestDate
    ].filter(Boolean).map((d) => new Date(d).getTime());

    const firstInteractionTimestamp = rawDates.length ? Math.min(...rawDates) : null;
    const firstInteractionDate = firstInteractionTimestamp ? new Date(firstInteractionTimestamp) : null;

    c.fanStats = {
      fanSince: firstInteractionDate
        ? firstInteractionDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : (u && u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'),
      firstInteractionAt: firstInteractionDate,
      totalSpentCoins: tStat.totalSpentCoins || 0,
      totalTipsCoins: tStat.totalTipsCoins || 0,
      messagesCount: mStat.count || 0
    };
  });

  res.status(200).json({
    status: 'success',
    conversations: populated
  });
});

// Retrieve message logs with specific recipient
exports.getMessages = catchAsync(async (req, res, next) => {
  const { receiverId } = req.params;

  // Retrieve DMs
  const messages = await Message.find({
    $or: [
      { senderId: req.user._id, receiverId },
      { senderId: receiverId, receiverId: req.user._id }
    ]
  }).sort({ createdAt: 1 });

  // Mark all incoming messages as read
  await Message.updateMany(
    { senderId: receiverId, receiverId: req.user._id, isOpened: false },
    { $set: { isOpened: true } }
  );

  const formattedMessages = await Promise.all(
    messages.map(async (msg) => await formatMessageForUser(req.user, msg))
  );

  res.status(200).json({
    status: 'success',
    messages: formattedMessages
  });
});

// Send single message
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { receiverId, content, mediaUrl, mediaType, isPaywall, coinPrice } = req.body;

  if (!receiverId) {
    return next(new ApiError(400, 'Recipient ID is required'));
  }

  if (isPaywall && (!coinPrice || coinPrice <= 0)) {
    return next(new ApiError(400, 'Paywall messages must have a coin price greater than 0'));
  }

  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    content,
    mediaUrl: mediaUrl || '',
    mediaType: mediaType || 'none',
    isPaywall: !!isPaywall,
    coinPrice: isPaywall ? coinPrice : 0
  });

  const formatted = await formatMessageForUser(req.user, message);

  // Trigger Socket.io real-time delivery
  const io = req.app.get('io');
  if (io) {
    // We emit to the receiver's private room
    io.to(receiverId.toString()).emit('new_message', formatted);
  }

  res.status(201).json({
    status: 'success',
    message: formatted
  });
});

// Unlock paywalled chat message
exports.unlockMessage = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    return next(new ApiError(404, 'Message not found'));
  }

  if (!message.isPaywall) {
    return next(new ApiError(400, 'This message is not paywalled'));
  }

  if (message.unlockedUsers.includes(req.user._id)) {
    const formatted = await formatMessageForUser(req.user, message);
    return res.status(200).json({
      status: 'success',
      unlocked: true,
      message: formatted
    });
  }

  // Deduct coins and credit the creator (sender of the paywall message)
  if (message.coinPrice > 0) {
    await walletService.transferCoins(req.user._id, message.senderId, message.coinPrice, 'ppv_unlock', message._id);
  }

  // Record unlock
  message.unlockedUsers.push(req.user._id);
  await message.save();

  const formatted = await formatMessageForUser(req.user, message);

  // Notify the sender that their message was unlocked
  const io = req.app.get('io');
  if (io) {
    io.to(message.senderId.toString()).emit('message_unlocked', {
      messageId: message._id,
      unlockedBy: req.user._id
    });
  }

  res.status(200).json({
    status: 'success',
    unlocked: true,
    message: formatted
  });
});

// Send mass message to all active subscribers (Creator only)
exports.sendMassMessage = catchAsync(async (req, res, next) => {
  const { content, mediaUrl, mediaType, isPaywall, coinPrice } = req.body;

  if (isPaywall && (!coinPrice || coinPrice <= 0)) {
    return next(new ApiError(400, 'Paywall messages must have a coin price greater than 0'));
  }

  // Find all active subscribers
  const subscriptions = await Subscription.find({
    creatorId: req.user._id,
    status: 'active',
    expiryDate: { $gt: new Date() }
  });

  if (subscriptions.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No active subscribers to send mass message to',
      count: 0
    });
  }

  const io = req.app.get('io');

  // Loop through subscribers and dispatch DMs
  const messages = await Promise.all(
    subscriptions.map(async (sub) => {
      const msg = await Message.create({
        senderId: req.user._id,
        receiverId: sub.userId,
        content,
        mediaUrl: mediaUrl || '',
        mediaType: mediaType || 'none',
        isPaywall: !!isPaywall,
        coinPrice: isPaywall ? coinPrice : 0
      });

      // Format for this specific recipient (who starts locked since they haven't bought it yet)
      const recipientUser = { _id: sub.userId, role: 'user' };
      const formatted = await formatMessageForUser(recipientUser, msg);

      if (io) {
        io.to(sub.userId.toString()).emit('new_message', formatted);
      }

      return msg;
    })
  );

  res.status(200).json({
    status: 'success',
    message: `Mass message successfully sent to ${subscriptions.length} subscribers`,
    count: subscriptions.length
  });
});

// Delete a single message
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;

  const msg = await Message.findById(messageId);
  if (!msg) {
    return next(new ApiError(404, 'Message not found'));
  }

  // Authorize: sender of message or admin
  if (msg.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'You do not have permission to delete this message'));
  }

  await Message.findByIdAndDelete(messageId);

  // Notify other party
  const io = req.app.get('io');
  if (io) {
    io.to(msg.receiverId.toString()).emit('message_deleted', { messageId });
  }

  res.status(200).json({
    status: 'success',
    message: 'Message successfully deleted'
  });
});

// Delete a complete conversation thread
exports.deleteConversation = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  // Delete all messages between req.user._id and userId
  await Message.deleteMany({
    $or: [
      { senderId: req.user._id, receiverId: userId },
      { senderId: userId, receiverId: req.user._id }
    ]
  });

  res.status(200).json({
    status: 'success',
    message: 'Conversation successfully cleared'
  });
});
