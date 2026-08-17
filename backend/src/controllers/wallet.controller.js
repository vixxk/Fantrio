const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const SystemSetting = require('../models/SystemSetting');
const CallLog = require('../models/CallLog');
const walletService = require('../services/wallet.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Retrieve coin balance
exports.getBalance = catchAsync(async (req, res, next) => {
  let wallet = await Wallet.findOne({ userId: req.user._id });

  if (!wallet) {
    // Fallback: create wallet dynamically if missing
    wallet = await Wallet.create({ userId: req.user._id, balanceCoins: 0 });
  }

  res.status(200).json({
    status: 'success',
    balanceCoins: wallet.balanceCoins
  });
});

// Retrieve transaction history (paginated, filterable)
// Supports optional ?page, ?limit, ?direction=in|out and ?type=<tx type>
exports.getTransactions = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const { direction, type } = req.query;

  const validTypes = ['deposit', 'withdrawal', 'subscription', 'tip', 'gift', 'ppv_unlock', 'call_billing', 'live_entry', 'store_purchase'];

  const query = {
    $or: [
      { senderId: req.user._id },
      { receiverId: req.user._id }
    ]
  };

  // Direction filter: 'in' = money received, 'out' = money spent
  if (direction === 'in') {
    query.$or = [{ receiverId: req.user._id }];
  } else if (direction === 'out') {
    query.$or = [{ senderId: req.user._id }];
  }

  // Optional type filter (single transaction type)
  if (type && validTypes.includes(type)) {
    if (type === 'gift' || type === 'tip') {
      query.type = { $in: ['gift', 'tip'] };
    } else {
      query.type = type;
    }
  }

  const [transactions, total, summary, spendingByType] = await Promise.all([
    Transaction.find(query)
      .populate('senderId', 'username displayName avatarUrl')
      .populate('receiverId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(query),
    Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalIn: {
            $sum: { $cond: [{ $eq: ['$receiverId', req.user._id] }, '$amountCoins', 0] }
          },
          totalOut: {
            $sum: { $cond: [{ $eq: ['$senderId', req.user._id] }, '$amountCoins', 0] }
          }
        }
      }
    ]),
    // Coins spent per category (drives the Spending Breakdown donut on the
    // transactions page). Deposits carry senderId null, so they never appear.
    Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          senderId: req.user._id
        }
      },
      {
        $group: {
          _id: '$type',
          coins: { $sum: '$amountCoins' }
        }
      },
      { $sort: { coins: -1 } }
    ])
  ]);

  // Batch resolve missing callType metadata for call_billing transactions from CallLog
  const callBillingTxs = transactions.filter((t) => t.type === 'call_billing' && (!t.metadata || !t.metadata.callType));
  if (callBillingTxs.length > 0) {
    const callLogIds = [...new Set(callBillingTxs.map((t) => t.referenceId).filter(Boolean))];
    if (callLogIds.length > 0) {
      const callLogs = await CallLog.find({ _id: { $in: callLogIds } }).select('type');
      const callTypeMap = {};
      callLogs.forEach((cl) => { callTypeMap[cl._id.toString()] = cl.type; });
      callBillingTxs.forEach((t) => {
        if (t.referenceId && callTypeMap[t.referenceId.toString()]) {
          if (!t.metadata) t.metadata = {};
          t.metadata.callType = callTypeMap[t.referenceId.toString()];
        }
      });
    }
  }

  res.status(200).json({
    status: 'success',
    transactions,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    limit,
    summary: summary[0] ? { totalIn: summary[0].totalIn, totalOut: summary[0].totalOut } : { totalIn: 0, totalOut: 0 },
    spendingBreakdown: spendingByType.map((s) => ({ type: s._id, coins: s.coins }))
  });
});

// Retrieve active coin packages, offer and available promo codes
exports.getCoinPackages = catchAsync(async (req, res, next) => {
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({
      commissionRate: 0.20,
      coinPackages: []
    });
  }

  const packages = settings.coinPackages
    .filter((p) => p.isActive !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((p) => ({
      id: p._id,
      coins: p.coins,
      priceUSD: p.priceUSD,
      oldPriceUSD: p.oldPriceUSD,
      bonusCoins: p.bonusCoins || 0,
      image: p.image,
      isPopular: p.isPopular
    }));

  const offerActive =
    settings.coinOffer.isActive === true &&
    (!settings.coinOffer.endsAt || settings.coinOffer.endsAt > Date.now());

  const promos = settings.promoCodes
    .filter(
      (p) =>
        p.isActive === true &&
        (!p.expiresAt || p.expiresAt > Date.now()) &&
        (p.maxRedemptions == null || p.redemptionCount < p.maxRedemptions) &&
        !p.redeemedBy.includes(req.user._id)
    )
    .map((p) => ({ code: p.code, bonusCoins: p.bonusCoins, description: p.description }));

  res.status(200).json({
    status: 'success',
    packages,
    offer: {
      isActive: offerActive,
      bonusPercent: settings.coinOffer.bonusPercent || 0,
      endsAt: settings.coinOffer.endsAt
    },
    promoCodes: promos
  });
});

// Purchase a coin package (simulated gateway payment)
exports.purchaseCoins = catchAsync(async (req, res, next) => {
  const { packageId } = req.body;

  const settings = await SystemSetting.findOne();
  if (!settings) {
    return next(new ApiError(400, 'Coin packages are not configured yet'));
  }

  const pack = settings.coinPackages.find((p) => p._id.toString() === String(packageId));
  if (!pack) {
    return next(new ApiError(404, 'Coin package not found'));
  }
  if (pack.isActive === false) {
    return next(new ApiError(400, 'This coin package is currently unavailable'));
  }

  // Apply the active offer bonus on top of any fixed pack bonus
  const offerActive =
    settings.coinOffer.isActive === true &&
    settings.coinOffer.bonusPercent > 0 &&
    (!settings.coinOffer.endsAt || settings.coinOffer.endsAt > Date.now());

  const offerBonusCoins = offerActive
    ? Math.round((pack.coins * settings.coinOffer.bonusPercent) / 100)
    : 0;
  const totalBonusCoins = (pack.bonusCoins || 0) + offerBonusCoins;
  const totalCoins = pack.coins + totalBonusCoins;

  // Simulate a secure gateway charge
  const gateway = ['segpay', 'ccbill'][Math.floor(Math.random() * 2)];
  const gatewayTxId = `${gateway}_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const cardLast4 = String(Math.floor(1000 + Math.random() * 9000));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let wallet = await Wallet.findOne({ userId: req.user._id }).session(session);
    if (!wallet) {
      const [newWallet] = await Wallet.create([{ userId: req.user._id, balanceCoins: 0 }], { session });
      wallet = newWallet;
    }

    wallet.balanceCoins = Number((wallet.balanceCoins + totalCoins).toFixed(2));
    await wallet.save({ session, validateBeforeSave: false });

    const [transaction] = await Transaction.create(
      [
        {
          senderId: null,
          receiverId: req.user._id,
          type: 'deposit',
          status: 'completed',
          amountCoins: totalCoins,
          amountUSD: pack.priceUSD,
          gateway,
          gatewayTxId,
          referenceId: pack._id,
          metadata: {
            packageId: pack._id,
            packageCoins: pack.coins,
            packagePriceUSD: pack.priceUSD,
            offerBonusCoins: offerBonusCoins,
            packBonusCoins: pack.bonusCoins || 0,
            totalBonusCoins,
            cardLast4
          }
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      message: `${totalCoins} coins added to your wallet`,
      balanceCoins: wallet.balanceCoins,
      transaction
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Redeem a promo code for bonus coins
exports.redeemPromo = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  if (!code || !String(code).trim()) {
    return next(new ApiError(400, 'Please enter a promo code'));
  }

  const settings = await SystemSetting.findOne();
  if (!settings) {
    return next(new ApiError(400, 'No promo codes available'));
  }

  const promo = settings.promoCodes.find(
    (p) => String(p.code).toLowerCase() === String(code).trim().toLowerCase()
  );
  if (!promo) {
    return next(new ApiError(400, 'Invalid or expired promo code.'));
  }
  if (promo.isActive !== true) {
    return next(new ApiError(400, 'Invalid or expired promo code.'));
  }
  if (promo.expiresAt && promo.expiresAt < Date.now()) {
    return next(new ApiError(400, 'Invalid or expired promo code.'));
  }
  if (promo.maxRedemptions != null && promo.redemptionCount >= promo.maxRedemptions) {
    return next(new ApiError(400, 'This promo code has reached its redemption limit.'));
  }
  if (promo.redeemedBy.includes(req.user._id)) {
    return next(new ApiError(400, 'You have already used this promo code.'));
  }

  const bonusCoins = promo.bonusCoins;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let wallet = await Wallet.findOne({ userId: req.user._id }).session(session);
    if (!wallet) {
      const [newWallet] = await Wallet.create([{ userId: req.user._id, balanceCoins: 0 }], { session });
      wallet = newWallet;
    }

    // Atomically claim this redemption slot. The $elemMatch guard re-validates
    // active / expiry / redemption-limit / duplicate inside the same update, so
    // two concurrent requests (double-click, multiple tabs, or two fans racing
    // for the last slot) can never both be granted — MongoDB serializes writes
    // to the document and the second writer either fails the guard or hits a
    // write conflict and aborts.
    const claimed = await SystemSetting.findOneAndUpdate(
      {
        _id: settings._id,
        promoCodes: {
          $elemMatch: {
            _id: promo._id,
            isActive: true,
            redeemedBy: { $ne: req.user._id },
            ...(promo.maxRedemptions != null ? { redemptionCount: { $lt: promo.maxRedemptions } } : {}),
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
          }
        }
      },
      { $inc: { 'promoCodes.$.redemptionCount': 1 } },
      { session, new: true }
    );

    if (!claimed) {
      await session.abortTransaction();
      session.endSession();
      const alreadyUsed = promo.redeemedBy.some((u) => String(u) === String(req.user._id));
      return next(
        new ApiError(
          400,
          alreadyUsed
            ? 'You have already used this promo code.'
            : 'This promo code is no longer available.'
        )
      );
    }

    // Record the redeemer (idempotent $addToSet — can never create duplicates).
    await SystemSetting.updateOne(
      { _id: claimed._id, 'promoCodes._id': promo._id },
      { $addToSet: { 'promoCodes.$.redeemedBy': req.user._id } },
      { session }
    );

    wallet.balanceCoins = Number((wallet.balanceCoins + bonusCoins).toFixed(2));
    await wallet.save({ session, validateBeforeSave: false });

    const [transaction] = await Transaction.create(
      [
        {
          senderId: null,
          receiverId: req.user._id,
          type: 'deposit',
          status: 'completed',
          amountCoins: bonusCoins,
          amountUSD: 0,
          gateway: 'internal',
          metadata: {
            promoCode: promo.code,
            bonusCoins
          }
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      message: `${promo.code} redeemed! ${bonusCoins} bonus coins added.`,
      balanceCoins: wallet.balanceCoins,
      transaction
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    // A concurrent redemption won the write race — surface a friendly message
    // instead of a generic 500 (the transaction itself stays safe).
    const isTransientWriteConflict =
      (typeof error.hasErrorLabel === 'function' && error.hasErrorLabel('TransientTransactionError')) ||
      (error.errorLabels && error.errorLabels.includes('TransientTransactionError')) ||
      error.codeName === 'TransientTransactionError' ||
      (error.message && error.message.includes('WriteConflict'));
    if (isTransientWriteConflict) {
      const fresh = await SystemSetting.findOne();
      const freshPromo = fresh ? fresh.promoCodes.id(promo._id) : null;
      if (freshPromo && freshPromo.redeemedBy.some((u) => String(u) === String(req.user._id))) {
        return next(new ApiError(400, 'You have already used this promo code.'));
      }
      return next(new ApiError(400, 'This promo code has reached its redemption limit.'));
    }
    throw error;
  }
});

// Spend coins (unlock media, tips) with a ledger record
exports.spendCoins = catchAsync(async (req, res, next) => {
  const { coins, type } = req.body;

  if (!coins || coins <= 0) {
    return next(new ApiError(400, 'Please specify a positive number of coins to spend'));
  }

  const validTypes = ['subscription', 'tip', 'ppv_unlock', 'call_billing'];
  const txType = validTypes.includes(type) ? type : 'ppv_unlock';

  let wallet = await Wallet.findOne({ userId: req.user._id });
  if (!wallet) {
    wallet = await Wallet.create({ userId: req.user._id, balanceCoins: 0 });
  }

  if (wallet.balanceCoins < coins) {
    return next(new ApiError(400, 'Insufficient coin balance'));
  }

  wallet.balanceCoins = Number((wallet.balanceCoins - coins).toFixed(2));
  await wallet.save();

  await Transaction.create({
    senderId: req.user._id,
    receiverId: null,
    type: txType,
    status: 'completed',
    amountCoins: coins,
    gateway: 'internal'
  });

  res.status(200).json({
    status: 'success',
    message: `${coins} coins deducted from your wallet`,
    balanceCoins: wallet.balanceCoins
  });
});

// Recharge wallet (dev/generic simulator - credits without gateway)
exports.rechargeWallet = catchAsync(async (req, res, next) => {
  const { coins } = req.body;

  if (!coins || coins <= 0) {
    return next(new ApiError(400, 'Please specify a positive number of coins to purchase'));
  }

  let wallet = await Wallet.findOne({ userId: req.user._id });
  if (!wallet) {
    wallet = await Wallet.create({ userId: req.user._id, balanceCoins: 0 });
  }

  // Credit wallet using service helper
  await walletService.transferCoins(null, req.user._id, coins, 'deposit');

  const updatedWallet = await Wallet.findOne({ userId: req.user._id });

  res.status(200).json({
    status: 'success',
    message: 'Wallet recharged successfully',
    balanceCoins: updatedWallet.balanceCoins
  });
});
