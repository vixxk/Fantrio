const Subscription = require('../../models/Subscription');
const CreatorProfile = require('../../models/CreatorProfile');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

const EXPIRING_SOON_DAYS = 7;

const deriveStatus = (sub) => {
  if (sub.status === 'cancelled' || sub.status === 'expired') return sub.status;
  const msLeft = new Date(sub.expiryDate).getTime() - Date.now();
  if (msLeft <= 0) return 'expired';
  if (msLeft < EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000) return 'expiring';
  return 'active';
};

// Admin: list all subscriptions with filters + pagination
exports.getSubscriptions = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { search, status, plan } = req.query;

  const query = {};
  if (plan && ['Basic', 'Premium', 'VIP'].includes(plan)) query.plan = plan;

  let userIds = null;
  if (search && search.trim()) {
    const searchRegex = {
      $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i'
    };
    const matchedUsers = await User.find({
      $or: [{ displayName: searchRegex }, { username: searchRegex }, { email: searchRegex }]
    }).select('_id').lean();
    userIds = matchedUsers.map((u) => u._id);
    query.$or = [
      { userId: { $in: userIds } },
      { creatorId: { $in: userIds } }
    ];
  }

  const [subs, total] = await Promise.all([
    Subscription.find(query)
      .populate('userId', 'username displayName email avatarUrl')
      .populate('creatorId', 'username displayName email avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Subscription.countDocuments(query)
  ]);

  // Apply derived status filter (handled in JS because 'expiring' is computed)
  let rows = subs.map((sub) => {
    const d = sub.toObject();
    d.status = deriveStatus(sub);
    return d;
  });

  if (status && ['active', 'expiring', 'expired', 'cancelled'].includes(status)) {
    rows = rows.filter((r) => r.status === status);
  }

  res.status(200).json({
    status: 'success',
    results: rows.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    subscriptions: rows
  });
});

// Admin: aggregate subscription statistics
exports.getSubscriptionStats = catchAsync(async (req, res, next) => {
  const subs = await Subscription.find();

  let active = 0;
  let expiring = 0;
  let expired = 0;
  let cancelled = 0;
  let mrr = 0;
  let totalRevenue = 0;

  for (const sub of subs) {
    const st = deriveStatus(sub);
    if (st === 'active') active += 1;
    else if (st === 'expiring') expiring += 1;
    else if (st === 'expired') expired += 1;
    else cancelled += 1;

    if (st === 'active' || st === 'expiring') mrr += sub.priceCoins || 0;
  }

  const txAgg = await Transaction.aggregate([
    { $match: { type: 'subscription', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amountCoins' }, count: { $sum: 1 } } }
  ]);
  const txStats = txAgg[0] || { total: 0, count: 0 };
  totalRevenue = txStats.total;

  res.status(200).json({
    status: 'success',
    stats: {
      total: subs.length,
      active,
      expiring,
      expired,
      cancelled,
      mrr: Number(mrr.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalTransactions: txStats.count
    }
  });
});

// Admin: cancel a subscription (no refund by default)
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const sub = await Subscription.findById(id);
  if (!sub) {
    return next(new ApiError(404, 'Subscription not found'));
  }

  if (sub.status !== 'active') {
    return next(new ApiError(400, 'Only active subscriptions can be cancelled'));
  }

  sub.status = 'cancelled';
  await sub.save();

  // Keep creator's subscriber count in sync
  await CreatorProfile.updateOne(
    { userId: sub.creatorId },
    { $inc: { subscriberCount: -1 } }
  );
  await CreatorProfile.updateOne(
    { userId: sub.creatorId, subscriberCount: { $lt: 0 } },
    { $set: { subscriberCount: 0 } }
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription cancelled successfully',
    subscription: sub
  });
});

// Admin: refund a subscription's coins (reverses balances and cancels the sub)
exports.refundSubscription = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const sub = await Subscription.findById(id);
  if (!sub) {
    return next(new ApiError(404, 'Subscription not found'));
  }

  const tx = await Transaction.findOne({
    senderId: sub.userId,
    receiverId: sub.creatorId,
    type: 'subscription',
    status: 'completed'
  }).sort({ createdAt: -1 });

  if (!tx) {
    return next(new ApiError(400, 'No completed payment transaction found for this subscription'));
  }

  const session = await require('mongoose').startSession();
  session.startTransaction();

  try {
    // Return original coins to the subscriber
    let userWallet = await Wallet.findOne({ userId: sub.userId }).session(session);
    if (!userWallet) {
      const [newWallet] = await Wallet.create([{ userId: sub.userId, balanceCoins: 0 }], { session });
      userWallet = newWallet;
    }
    userWallet.balanceCoins = Number((userWallet.balanceCoins + tx.amountCoins).toFixed(2));
    await userWallet.save({ session, validateBeforeSave: false });

    // Deduct creator share (net of commission) from creator wallet
    if (sub.creatorId) {
      const SystemSetting = require('../../models/SystemSetting');
      const systemSetting = await SystemSetting.findOne().session(session);
      const commRate = systemSetting ? systemSetting.commissionRate : 0.20;
      const net = tx.amountCoins * (1 - commRate);

      const creatorWallet = await Wallet.findOne({ userId: sub.creatorId }).session(session);
      if (creatorWallet) {
        creatorWallet.balanceCoins = Number((creatorWallet.balanceCoins - net).toFixed(2));
        await creatorWallet.save({ session, validateBeforeSave: false });
      }
    }

    // Mark the transaction refunded
    tx.status = 'refunded';
    await tx.save({ session, validateBeforeSave: false });

    // Cancel the subscription
    if (sub.status === 'active') {
      sub.status = 'cancelled';
      await sub.save({ session, validateBeforeSave: false });

      await CreatorProfile.updateOne(
        { userId: sub.creatorId },
        { $inc: { subscriberCount: -1 } }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      message: 'Subscription refunded successfully',
      subscription: sub,
      transaction: tx
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
