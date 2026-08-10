const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const SystemSetting = require('../models/SystemSetting');
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
  const validTypes = ['deposit', 'withdrawal', 'subscription', 'tip', 'gift', 'ppv_unlock', 'call_billing', 'live_entry', 'store_purchase'];
  if (validTypes.includes(type)) {
    query.type = type;
  }

  const [transactions, total, summary] = await Promise.all([
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
    ])
  ]);

  res.status(200).json({
    status: 'success',
    transactions,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    limit,
    summary: summary[0] ? { totalIn: summary[0].totalIn, totalOut: summary[0].totalOut } : { totalIn: 0, totalOut: 0 }
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

    wallet.balanceCoins = Number((wallet.balanceCoins + bonusCoins).toFixed(2));
    await wallet.save({ session, validateBeforeSave: false });

    promo.redemptionCount += 1;
    promo.redeemedBy.push(req.user._id);
    await settings.save({ session, validateBeforeSave: false });

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
