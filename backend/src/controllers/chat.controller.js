const Message = require('../models/Message');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
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
        console.error('[AWS S3] Error presigning message media:', err);
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
    select: 'username displayName avatarUrl role',
    model: 'User'
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
