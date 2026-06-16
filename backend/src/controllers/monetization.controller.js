const mongoose = require('mongoose');
const CreatorProfile = require('../models/CreatorProfile');
const Subscription = require('../models/Subscription');
const Post = require('../models/Post');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const walletService = require('../services/wallet.service');
const awsService = require('../services/aws.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Subscribe to a creator
exports.subscribeToCreator = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;

  if (creatorId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot subscribe to yourself'));
  }

  // Find creator profile
  const creatorProfile = await CreatorProfile.findOne({ userId: creatorId });
  if (!creatorProfile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  const price = creatorProfile.rates.subscriptionMonthly || 0;

  // Check if active subscription already exists
  const existingSub = await Subscription.findOne({
    userId: req.user._id,
    creatorId,
    status: 'active',
    expiryDate: { $gt: new Date() }
  });

  if (existingSub) {
    return res.status(200).json({
      status: 'success',
      message: 'You are already actively subscribed to this creator',
      subscription: existingSub
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

// Unlock PPV Content
exports.unlockPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  if (post.postType !== 'ppv') {
    return next(new ApiError(400, 'This post is not pay-per-view'));
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
          console.error(`[AWS S3] Error generating download URL for key ${key}:`, err);
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

  // Perform atomic coin transfer
  const transaction = await walletService.transferCoins(req.user._id, creatorId, coins, 'tip');

  res.status(200).json({
    status: 'success',
    message: `Successfully tipped ${coins} coins to creator`,
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
