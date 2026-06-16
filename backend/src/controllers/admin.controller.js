const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Post = require('../models/Post');
const CallLog = require('../models/CallLog');
const SystemSetting = require('../models/SystemSetting');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Aggregate and return dashboard metrics
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalCreators = await User.countDocuments({ role: 'creator' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });

  // Coins circulating in wallets
  const coinCirculation = await Wallet.aggregate([
    {
      $group: {
        _id: null,
        totalCoins: { $sum: '$balanceCoins' }
      }
    }
  ]);
  const totalCoinsCirculating = coinCirculation[0] ? coinCirculation[0].totalCoins : 0;

  // Breakdown of transactions by category
  const transactionBreakdown = await Transaction.aggregate([
    {
      $group: {
        _id: '$type',
        totalCoins: { $sum: '$amountCoins' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Aggregate reported posts stats
  const reportsStats = await Post.aggregate([
    {
      $match: { 'reports.0': { $exists: true } }
    },
    {
      $project: {
        reportsCount: { $size: '$reports' }
      }
    },
    {
      $group: {
        _id: null,
        totalReportedPosts: { $sum: 1 },
        totalReportsCount: { $sum: '$reportsCount' }
      }
    }
  ]);

  const reportedPostsStats = reportsStats[0] || { totalReportedPosts: 0, totalReportsCount: 0 };
  const activeCallsCount = await CallLog.countDocuments({ status: 'active' });

  res.status(200).json({
    status: 'success',
    stats: {
      users: {
        totalUsers,
        totalCreators,
        totalAdmins
      },
      wallet: {
        totalCoinsCirculating
      },
      transactions: transactionBreakdown,
      moderation: reportedPostsStats,
      calls: {
        activeCallsCount
      }
    }
  });
});

// Retrieve all reported posts
exports.getReportedPosts = catchAsync(async (req, res, next) => {
  const posts = await Post.find({ 'reports.0': { $exists: true } })
    .populate('creatorId', 'username displayName avatarUrl')
    .populate('reports.userId', 'username displayName')
    .sort({ 'reports.date': -1 });

  res.status(200).json({
    status: 'success',
    posts
  });
});

// Take action on reported content (dismiss or delete)
exports.moderatePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { action } = req.body; // 'dismiss' or 'delete'

  if (!['dismiss', 'delete'].includes(action)) {
    return next(new ApiError(400, "Please provide valid moderation action: 'dismiss' or 'delete'"));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  if (action === 'delete') {
    await Post.findByIdAndDelete(postId);
    res.status(200).json({
      status: 'success',
      message: 'Post successfully deleted'
    });
  } else {
    // Dismiss reports
    post.reports = [];
    await post.save({ validateBeforeSave: false });
    res.status(200).json({
      status: 'success',
      message: 'Reports dismissed'
    });
  }
});

// Fetch all users with search, role, and suspension filters
exports.getUsersList = catchAsync(async (req, res, next) => {
  const { search, role, status } = req.query;
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const skip = (page - 1) * limit;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (status) {
    query.isSuspended = status === 'suspended';
  }

  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  const users = await User.find(query)
    .select('-password -otp')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    status: 'success',
    total,
    page,
    limit,
    users
  });
});

// Suspend or lift suspension on a user
exports.toggleUserSuspension = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  if (user.role === 'admin') {
    return next(new ApiError(400, 'Cannot suspend another administrator'));
  }

  user.isSuspended = !user.isSuspended;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `User accounts successfully ${user.isSuspended ? 'suspended' : 'activated'}`,
    isSuspended: user.isSuspended
  });
});

// Fetch active Zego call sessions
exports.getActiveCalls = catchAsync(async (req, res, next) => {
  const calls = await CallLog.find({ status: 'active' })
    .populate('callerId', 'username displayName avatarUrl')
    .populate('receiverId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    calls
  });
});

// Retrieve system configurations
exports.getSystemSettings = catchAsync(async (req, res, next) => {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({
      commissionRate: 0.20,
      coinPackages: [
        { coins: 100, priceUSD: 9.99 },
        { coins: 500, priceUSD: 44.99 },
        { coins: 1000, priceUSD: 79.99 }
      ]
    });
  }

  res.status(200).json({
    status: 'success',
    settings
  });
});

// Update system configurations (commission & coin packages)
exports.updateSystemSettings = catchAsync(async (req, res, next) => {
  const { commissionRate, coinPackages } = req.body;

  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = new SystemSetting();
  }

  if (commissionRate !== undefined) {
    settings.commissionRate = commissionRate;
  }

  if (coinPackages !== undefined) {
    settings.coinPackages = coinPackages;
  }

  await settings.save();

  res.status(200).json({
    status: 'success',
    settings
  });
});
