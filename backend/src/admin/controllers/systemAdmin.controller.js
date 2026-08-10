const mongoose = require('mongoose');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const Post = require('../../models/Post');
const CallLog = require('../../models/CallLog');
const LiveStream = require('../../models/LiveStream');
const Subscription = require('../../models/Subscription');
const Report = require('../../models/Report');
const SystemSetting = require('../../models/SystemSetting');
const catchAsync = require('../../utils/catchAsync');

// Aggregate and return dashboard metrics
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalCreators = await User.countDocuments({ role: 'creator' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });

  const coinCirculation = await Wallet.aggregate([
    {
      $group: {
        _id: null,
        totalCoins: { $sum: '$balanceCoins' }
      }
    }
  ]);
  const totalCoinsCirculating = coinCirculation[0] ? coinCirculation[0].totalCoins : 0;

  const transactionBreakdown = await Transaction.aggregate([
    {
      $group: {
        _id: '$type',
        totalCoins: { $sum: '$amountCoins' },
        count: { $sum: 1 }
      }
    }
  ]);

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

  // ---- Extra engagement / platform metrics ----
  const [totalPosts, activeSubscriptions, liveStreamsCount, suspendedUsers, todaysSignups, pendingReports, revenueAgg] =
    await Promise.all([
      Post.countDocuments(),
      Subscription.countDocuments({
        status: { $in: ['active', 'expiring'] },
        expiryDate: { $gt: new Date() }
      }),
      LiveStream.countDocuments({ isLive: true }),
      User.countDocuments({ isSuspended: true }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Report.countDocuments({ status: 'pending' }),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amountCoins' }, count: { $sum: 1 } } }
      ])
    ]);

  const totalRevenueCoins = revenueAgg[0] ? revenueAgg[0].total : 0;
  const completedTransactionsCount = revenueAgg[0] ? revenueAgg[0].count : 0;

  res.status(200).json({
    status: 'success',
    stats: {
      users: {
        totalUsers,
        totalCreators,
        totalAdmins,
        suspendedUsers,
        todaysSignups
      },
      wallet: {
        totalCoinsCirculating
      },
      transactions: transactionBreakdown,
      moderation: reportedPostsStats,
      calls: {
        activeCallsCount
      },
      engagement: {
        totalPosts,
        activeSubscriptions,
        liveStreamsCount
      },
      revenue: {
        totalRevenueCoins,
        completedTransactionsCount
      },
      support: {
        pendingReports
      }
    }
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

// Update system configurations
exports.updateSystemSettings = catchAsync(async (req, res, next) => {
  const { commissionRate, coinPackages, coinOffer, promoCodes } = req.body;

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

  if (coinOffer !== undefined) {
    settings.coinOffer = coinOffer;
  }

  if (promoCodes !== undefined) {
    settings.promoCodes = promoCodes;
  }

  await settings.save();

  res.status(200).json({
    status: 'success',
    settings
  });
});
