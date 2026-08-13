const mongoose = require('mongoose');
const CreatorProfile = require('../models/CreatorProfile');
const Subscription = require('../models/Subscription');
const Post = require('../models/Post');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const walletService = require('../services/wallet.service');
const awsService = require('../services/aws.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Number of days before expiry a subscription is considered "expiring soon"
const EXPIRING_SOON_DAYS = 7;

// Derive the user-facing status including the "expiring" state.
// DB stores only active/expired/cancelled; "expiring" is computed from expiryDate.
const deriveStatus = (sub) => {
  if (sub.status === 'cancelled' || sub.status === 'expired') {
    return sub.status;
  }
  if (!sub.expiryDate) {
    return 'active';
  }
  const msLeft = new Date(sub.expiryDate).getTime() - Date.now();
  if (msLeft <= 0) return 'expired';
  if (msLeft < EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000) return 'expiring';
  return 'active';
};

// Resolve a creator's plan tier + price for a given plan name.
// Falls back to rates.subscriptionMonthly (treated as Premium).
const resolvePlan = (creatorProfile, planName) => {
  const name = planName || 'Premium';
  const plans = creatorProfile.subscriptionPlans || [];
  const plan = plans.find((p) => p.name === name && p.isActive !== false);
  if (plan) {
    return { name: plan.name, priceCoins: plan.priceCoins };
  }
  // Fallback: single tier using the legacy monthly rate
  return {
    name: plans.length > 0 ? 'Premium' : name,
    priceCoins: creatorProfile.rates.subscriptionMonthly || 0
  };
};

// Subscribe to a creator
exports.subscribeToCreator = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;
  const { plan } = req.body || {};

  if (creatorId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot subscribe to yourself'));
  }

  // Find creator profile
  const creatorProfile = await CreatorProfile.findOne({ userId: creatorId });
  if (!creatorProfile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  // Prevent subscribing to a blocked creator or a creator who blocked you
  if (req.user.blockedUsers.includes(creatorId)) {
    return next(new ApiError(400, 'You cannot subscribe to a user you have blocked'));
  }
  const blockedByCreator = await User.exists({ _id: creatorId, blockedUsers: req.user._id });
  if (blockedByCreator) {
    return next(new ApiError(400, 'You cannot subscribe to this creator'));
  }

  const { name: planName, priceCoins: price } = resolvePlan(creatorProfile, plan);

  // Helper to rank subscription plan tiers for upgrade/degradation check
  const getPlanRank = (pName) => {
    const name = (pName || '').toLowerCase();
    if (name.includes('vip') || name.includes('ultimate')) return 3;
    if (name.includes('premium') || name.includes('pro')) return 2;
    if (name.includes('basic') || name.includes('starter')) return 1;
    return 1;
  };

  // Check if active subscription already exists (any plan)
  const existingSub = await Subscription.findOne({
    userId: req.user._id,
    creatorId,
    status: 'active',
    expiryDate: { $gt: new Date() }
  });

  if (existingSub) {
    const existingRank = getPlanRank(existingSub.plan);
    const requestedRank = getPlanRank(planName);
    const existingPrice = existingSub.priceCoins || 0;

    if (existingSub.plan === planName) {
      return res.status(200).json({
        status: 'success',
        message: `You are already actively subscribed to the ${planName} plan`,
        subscription: existingSub,
        alreadySubscribed: true
      });
    }

    if (requestedRank < existingRank || (requestedRank === existingRank && price <= existingPrice)) {
      return next(new ApiError(400, `Plan degradation is not allowed. You are currently on the ${existingSub.plan} plan.`));
    }

    // Upgradation: charge upgrade difference (or full price if lower)
    const upgradeCost = price > existingPrice ? price - existingPrice : price;
    if (upgradeCost > 0) {
      await walletService.transferCoins(req.user._id, creatorId, upgradeCost, 'subscription');
    }

    existingSub.plan = planName;
    existingSub.priceCoins = price;
    await existingSub.save();

    return res.status(200).json({
      status: 'success',
      message: `Subscription successfully upgraded to ${planName}!`,
      subscription: existingSub,
      upgraded: true
    });
  }

  // Execute atomic coin transfer (20% platform commission)
  if (price > 0) {
    await walletService.transferCoins(req.user._id, creatorId, price, 'subscription');
  }

  // Create active subscription (valid for 30 days)
  const subscription = await Subscription.create({
    userId: req.user._id,
    creatorId,
    status: 'active',
    plan: planName,
    startDate: Date.now(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    priceCoins: price
  });

  // Increment creator's subscriber count
  creatorProfile.subscriberCount += 1;
  await creatorProfile.save();

  res.status(200).json({
    status: 'success',
    subscription
  });
});

// Renew an existing subscription, or create a new one if none is active.
// Extends the expiry by 30 days (counted from current expiry, not from now)
// so users are not penalised for renewing early.
exports.renewSubscription = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;
  const { plan } = req.body || {};

  if (creatorId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot subscribe to yourself'));
  }

  const creatorProfile = await CreatorProfile.findOne({ userId: creatorId });
  if (!creatorProfile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  // Prevent renewing a blocked creator or a creator who blocked you
  if (req.user.blockedUsers.includes(creatorId)) {
    return next(new ApiError(400, 'You cannot renew a subscription to a user you have blocked'));
  }
  const blockedByCreator = await User.exists({ _id: creatorId, blockedUsers: req.user._id });
  if (blockedByCreator) {
    return next(new ApiError(400, 'You cannot renew this subscription'));
  }

  const { name: planName, priceCoins: price } = resolvePlan(creatorProfile, plan);

  const activeSub = await Subscription.findOne({
    userId: req.user._id,
    creatorId,
    status: 'active',
    expiryDate: { $gt: new Date() }
  });

  if (activeSub) {
    // Renew existing: extend from current expiry, charge the current plan price
    if (price > 0) {
      await walletService.transferCoins(req.user._id, creatorId, price, 'subscription');
    }

    const baseDate = new Date(activeSub.expiryDate).getTime() > Date.now()
      ? new Date(activeSub.expiryDate)
      : new Date();
    activeSub.expiryDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    activeSub.plan = planName;
    activeSub.priceCoins = price;
    await activeSub.save();

    return res.status(200).json({
      status: 'success',
      message: 'Subscription renewed successfully',
      renewed: true,
      subscription: activeSub
    });
  }

  // No active subscription -> full re-subscribe (charge + new 30 day period)
  if (price > 0) {
    await walletService.transferCoins(req.user._id, creatorId, price, 'subscription');
  }

  const subscription = await Subscription.create({
    userId: req.user._id,
    creatorId,
    status: 'active',
    plan: planName,
    startDate: Date.now(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    priceCoins: price
  });

  creatorProfile.subscriberCount += 1;
  await creatorProfile.save();

  res.status(200).json({
    status: 'success',
    message: 'Subscription created successfully',
    renewed: false,
    subscription
  });
});

// Unlock PPV Content
exports.unlockPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  // Creator-hidden posts cannot be unlocked by users (owner & admins are exempt)
  if (post.isHidden && post.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(404, 'Post not found'));
  }

  if (post.postType !== 'ppv') {
    return next(new ApiError(400, 'This post is not pay-per-view'));
  }

  // Prevent unlocking a blocked creator's post
  if (req.user.blockedUsers.includes(post.creatorId.toString())) {
    return next(new ApiError(400, 'You cannot unlock content from a user you have blocked'));
  }

  // Helper to generate presigned media urls
  const getPresignedMediaUrls = async (post) => {
    return await Promise.all(
      post.media.map(async (item) => {
        let key = item.url;
        if (item.url.includes('.amazonaws.com/')) {
          key = item.url.split('.amazonaws.com/')[1];
        }
        let signedUrl = item.url;
        try {
          signedUrl = await awsService.getPresignedDownloadUrl(key);
        } catch (err) {
          console.error(`[Media Storage] Error generating download URL for key ${key}:`, err);
        }
        return {
          _id: item._id,
          url: signedUrl,
          type: item.type
        };
      })
    );
  };

  // Check if owner or admin is unlocking
  if (post.creatorId.toString() === req.user._id.toString() || req.user.role === 'admin') {
    const mediaUrls = await getPresignedMediaUrls(post);
    return res.status(200).json({
      status: 'success',
      unlocked: true,
      mediaUrls
    });
  }

  // Check if already unlocked via transactions
  const existingUnlock = await Transaction.findOne({
    senderId: req.user._id,
    type: 'ppv_unlock',
    status: 'completed',
    referenceId: post._id
  });

  if (existingUnlock) {
    const mediaUrls = await getPresignedMediaUrls(post);
    return res.status(200).json({
      status: 'success',
      unlocked: true,
      mediaUrls
    });
  }

  // Execute transfer
  if (post.coinPrice > 0) {
    await walletService.transferCoins(req.user._id, post.creatorId, post.coinPrice, 'ppv_unlock', post._id);
  }

  const mediaUrls = await getPresignedMediaUrls(post);

  res.status(200).json({
    status: 'success',
    unlocked: true,
    mediaUrls
  });
});

// Tip a creator
exports.tipCreator = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;
  const { coins } = req.body;

  if (!coins || coins <= 0) {
    return next(new ApiError(400, 'Please provide a positive number of coins to tip'));
  }

  if (creatorId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot tip yourself'));
  }

  // Verify creator exists
  const creatorProfile = await CreatorProfile.findOne({ userId: creatorId });
  if (!creatorProfile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  // Prevent tipping a blocked creator or a creator who blocked you
  if (req.user.blockedUsers.includes(creatorId)) {
    return next(new ApiError(400, 'You cannot tip a user you have blocked'));
  }
  const blockedByCreator = await User.exists({ _id: creatorId, blockedUsers: req.user._id });
  if (blockedByCreator) {
    return next(new ApiError(400, 'You cannot tip this creator'));
  }

  // Perform atomic coin transfer
  const transaction = await walletService.transferCoins(req.user._id, creatorId, coins, 'tip');

  res.status(200).json({
    status: 'success',
    message: `Successfully tipped ${coins} coins to creator`,
    transaction
  });
});

// Gift catalog (authoritative from the shared constant)
exports.getGiftCatalog = catchAsync(async (req, res, next) => {
  const { getPublicGifts, TIER_NAMES } = require('../utils/gifts');
  const type = req.query.type || (req.query.postId ? 'comment' : 'chat');
  res.status(200).json({
    status: 'success',
    gifts: getPublicGifts(type),
    tierNames: TIER_NAMES
  });
});

// Send a gift (used inside live streams and 1:1 calls). Transfers coins,
// logs a 'gift' transaction, and broadcasts a `gift_received` event so the
// animation plays in real time for the sender, the receiver, and every
// viewer in the live stream room.
exports.sendGift = catchAsync(async (req, res, next) => {
  const { giftId, streamId, callRoomId, postId } = req.body;
  const { receiverId } = req.params;
  const { getGiftById } = require('../utils/gifts');

  const gift = getGiftById(giftId);
  if (!gift) {
    return next(new ApiError(400, 'Unknown gift'));
  }

  if (!mongoose.Types.ObjectId.isValid(receiverId) || receiverId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot send a gift to yourself'));
  }

  let targetUserId = receiverId;
  let receiver = await User.findById(receiverId);
  if (!receiver) {
    const CreatorProfile = require('../models/CreatorProfile');
    const creator = await CreatorProfile.findById(receiverId);
    if (creator && creator.userId) {
      targetUserId = creator.userId.toString();
      receiver = await User.findById(targetUserId);
    }
  }
  if (!receiver) {
    return next(new ApiError(404, 'Recipient not found'));
  }

  // Only fans can send gifts to creators
  if (req.user.role === 'creator') {
    return next(new ApiError(403, 'Only fans can send gifts to creators'));
  }
  if (receiver.role !== 'creator') {
    return next(new ApiError(400, 'Gifts can only be sent to creators'));
  }

  // Blocked-user guards (same policy as tipping)
  if (req.user.blockedUsers.includes(targetUserId)) {
    return next(new ApiError(400, 'You cannot send a gift to a user you have blocked'));
  }
  const blockedByReceiver = await User.exists({ _id: targetUserId, blockedUsers: req.user._id });
  if (blockedByReceiver) {
    return next(new ApiError(400, 'You cannot send a gift to this user'));
  }

  // Atomic coin transfer (platform commission applied inside the service).
  // `referenceId` points to the stream when the gift is sent inside a live
  // stream; call gifts instead carry their call's roomId in `metadata` so
  // admins can link them back to the CallLog by roomId.
  const transaction = await walletService.transferCoins(
    req.user._id,
    targetUserId,
    gift.coins,
    'gift',
    streamId || null,
    0.20,
    { callRoomId: callRoomId || null }
  );

  const meta = {
    callRoomId: callRoomId || null,
    giftId: gift.id,
    giftName: gift.name,
    giftEmoji: gift.emoji,
    giftCoins: gift.coins,
    giftTier: gift.tier || 1
  };

  // If gift was sent for a post, attach a gift comment card to the post
  let updatedPost = null;
  if (postId && mongoose.Types.ObjectId.isValid(postId)) {
    try {
      const postObj = await Post.findById(postId);
      if (postObj) {
        postObj.comments.push({
          userId: req.user._id,
          text: `Sent ${gift.name}`,
          isGift: true,
          giftEmoji: gift.emoji,
          giftName: gift.name,
          giftTier: gift.tier || 1,
          giftCoins: gift.coins || 0,
          createdAt: new Date()
        });
        postObj.giftCount = (postObj.giftCount || 0) + 1;
        postObj.commentsCount = postObj.comments.length;
        await postObj.save();
        const addedComment = postObj.comments[postObj.comments.length - 1];
        meta.postId = postId;
        if (addedComment) meta.commentId = addedComment._id;
        updatedPost = await Post.findById(postId).populate('comments.userId', 'displayName username avatarUrl isVerifiedBadge');
      }
    } catch (e) {
      console.error('Failed to attach gift comment to post:', e);
    }
  }

  // Create persistent Message record for chat threads so it renders as a Gift Card
  let chatMessage = null;
  try {
    const Message = require('../models/Message');
    chatMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      content: `${gift.emoji} Sent ${gift.name} (${gift.coins.toLocaleString()} Coins)!`,
      isGift: true,
      giftName: gift.name,
      giftEmoji: gift.emoji,
      giftCoins: gift.coins,
      giftTier: gift.tier || 1
    });
    if (chatMessage) meta.messageId = chatMessage._id;
  } catch (err) {
    console.error('Failed to create gift chat message:', err);
  }

  if (transaction) {
    transaction.metadata = { ...(transaction.metadata || {}), ...meta };
    await transaction.save();
  }

  // Broadcast the animation payload to everyone who should see it:
  //  - the sender (their own optimistic event is deduped by eventId)
  //  - the receiver (their user room)
  //  - every viewer in the live stream room, when sent inside a stream
  const eventId = transaction._id.toString();
  const senderPayload = {
    eventId,
    giftId: gift.id,
    name: gift.name,
    emoji: gift.emoji,
    coins: gift.coins,
    tier: gift.tier,
    sender: {
      id: req.user._id,
      displayName: req.user.displayName || req.user.username || 'Fan',
      avatarUrl: req.user.avatarUrl || ''
    },
    receiverId,
    context: {
      type: streamId ? 'stream' : 'call',
      streamId: streamId || null,
      callRoomId: callRoomId || null
    }
  };

  const io = req.app.get('io');
  const senderWallet = await Wallet.findOne({ userId: req.user._id });
  const receiverWallet = await Wallet.findOne({ userId: targetUserId });

  if (io) {
    io.to(req.user._id.toString()).emit('gift_received', senderPayload);
    io.to(targetUserId.toString()).emit('gift_received', senderPayload);
    if (streamId) {
      io.to(`live_stream_${streamId}`).emit('gift_received', senderPayload);
    }
    if (chatMessage) {
      io.to(req.user._id.toString()).emit('new_message', chatMessage);
      io.to(targetUserId.toString()).emit('new_message', chatMessage);
    }
    if (senderWallet) {
      io.to(req.user._id.toString()).emit('balance_updated', { balanceCoins: senderWallet.balanceCoins });
    }
    if (receiverWallet) {
      io.to(targetUserId.toString()).emit('balance_updated', { balanceCoins: receiverWallet.balanceCoins });
    }
  }

  res.status(200).json({
    status: 'success',
    message: `${req.user.displayName || 'You'} sent ${gift.name} (${gift.coins} coins)`,
    eventId,
    sender: senderPayload.sender,
    gift: {
      id: gift.id,
      name: gift.name,
      emoji: gift.emoji,
      coins: gift.coins,
      tier: gift.tier
    },
    post: updatedPost ? {
      ...updatedPost.toObject(),
      commentsCount: updatedPost.comments ? updatedPost.comments.length : 0,
      giftCount: updatedPost.comments ? updatedPost.comments.filter(c => c.isGift).length : 0
    } : null,
    balanceCoins: senderWallet ? senderWallet.balanceCoins : 0,
    transaction
  });
});

// Request withdrawal (Creator only)
exports.requestWithdrawal = catchAsync(async (req, res, next) => {
  const { coins, paymentMethodDetails } = req.body;

  if (!coins || coins <= 0) {
    return next(new ApiError(400, 'Please specify a positive number of coins to withdraw'));
  }

  const wallet = await Wallet.findOne({ userId: req.user._id });
  if (!wallet || wallet.balanceCoins < coins) {
    return next(new ApiError(400, 'Insufficient coin balance for withdrawal'));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Deduct coins from creator's wallet
    wallet.balanceCoins = Number((wallet.balanceCoins - coins).toFixed(2));
    await wallet.save({ session, validateBeforeSave: false });

    // Log a pending withdrawal transaction
    const [transaction] = await Transaction.create(
      [
        {
          senderId: req.user._id,
          receiverId: null,
          type: 'withdrawal',
          status: 'pending',
          amountCoins: coins,
          gateway: 'internal',
          gatewayTxId: paymentMethodDetails ? JSON.stringify(paymentMethodDetails) : null
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      withdrawalId: transaction._id,
      statusCoins: 'pending'
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

// Retrieve my subscriptions (with derived "expiring" status + summary stats)
exports.getMySubscriptions = catchAsync(async (req, res, next) => {
  const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ createdAt: -1 });

  const subData = await Promise.all(subscriptions.map(async (sub) => {
    const profile = await CreatorProfile.findOne({ userId: sub.creatorId });
    return {
      _id: sub._id,
      creatorId: sub.creatorId,
      status: deriveStatus(sub),
      plan: sub.plan,
      startDate: sub.startDate,
      expiryDate: sub.expiryDate,
      priceCoins: sub.priceCoins,
      daysUntilExpiry: sub.expiryDate
        ? Math.max(0, Math.ceil((new Date(sub.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
        : 0,
      creator: profile ? {
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        isVerifiedBadge: profile.isVerifiedBadge,
        isOnline: profile.showOnlineStatus !== false && profile.isOnline,
        rates: profile.rates,
        subscriptionPlans: profile.subscriptionPlans
      } : null
    };
  }));

  // Summary used by the subscriptions overview sidebar
  const activeCount = subData.filter((s) => s.status === 'active').length;
  const expiringCount = subData.filter((s) => s.status === 'expiring').length;
  const expiredCount = subData.filter((s) => s.status === 'expired').length;
  const cancelledCount = subData.filter((s) => s.status === 'cancelled').length;

  // Monthly recurring spend = sum of active subscription prices
  const monthlySpend = subData
    .filter((s) => s.status === 'active' || s.status === 'expiring')
    .reduce((sum, s) => sum + (s.priceCoins || 0), 0);

  // Lifetime total spent on subscriptions
  const spentTx = await Transaction.find({
    senderId: req.user._id,
    type: 'subscription',
    status: 'completed'
  });
  const totalSpentCoins = spentTx.reduce((sum, t) => sum + (t.amountCoins || 0), 0);

  res.status(200).json({
    status: 'success',
    subscriptions: subData,
    summary: {
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount,
      cancelled: cancelledCount,
      monthlySpendCoins: Number(monthlySpend.toFixed(2)),
      totalSpentCoins: Number(totalSpentCoins.toFixed(2))
    }
  });
});

// Detailed subscription spending history for the current user
exports.getSpendingHistory = catchAsync(async (req, res, next) => {
  const transactions = await Transaction.find({
    senderId: req.user._id,
    type: 'subscription',
    status: 'completed'
  })
    .populate('receiverId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });

  const history = await Promise.all(transactions.map(async (tx) => {
    let creator = null;
    if (tx.receiverId) {
      const profile = await CreatorProfile.findOne({ userId: tx.receiverId._id });
      creator = {
        _id: tx.receiverId._id,
        displayName: (profile && profile.displayName) || tx.receiverId.displayName,
        username: (profile && profile.username) || tx.receiverId.username,
        avatarUrl: (profile && profile.avatarUrl) || tx.receiverId.avatarUrl
      };
    }
    return {
      _id: tx._id,
      amountCoins: tx.amountCoins,
      status: tx.status,
      createdAt: tx.createdAt,
      creator
    };
  }));

  res.status(200).json({
    status: 'success',
    history
  });
});

// Unsubscribe from a creator
exports.unsubscribeFromCreator = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;

  const subscription = await Subscription.findOne({
    userId: req.user._id,
    creatorId,
    status: 'active'
  });

  if (!subscription) {
    return next(new ApiError(404, 'No active subscription found for this creator'));
  }

  subscription.status = 'cancelled';
  await subscription.save();

  const creatorProfile = await CreatorProfile.findOne({ userId: creatorId });
  if (creatorProfile) {
    creatorProfile.subscriberCount = Math.max(0, creatorProfile.subscriberCount - 1);
    await creatorProfile.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Successfully unsubscribed from creator',
    subscription
  });
});

// Retrieve withdrawal history for a creator
exports.getWithdrawalHistory = catchAsync(async (req, res, next) => {
  const withdrawals = await Transaction.find({
    senderId: req.user._id,
    type: 'withdrawal'
  }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    withdrawals
  });
});
