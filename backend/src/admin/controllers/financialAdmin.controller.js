const mongoose = require('mongoose');
const Transaction = require('../../models/Transaction');
const Wallet = require('../../models/Wallet');
const SystemSetting = require('../../models/SystemSetting');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');

// Retrieve all transactions
exports.getAllTransactions = catchAsync(async (req, res, next) => {
  const { search, from, to } = req.query;

  const transactions = await Transaction.find(buildDateRangeQuery(from, to))
    .populate('senderId', 'username displayName email')
    .populate('receiverId', 'username displayName email')
    .sort({ createdAt: -1 });

  const filtered = search
    ? transactions.filter((t) => {
        const q = search.toLowerCase();
        const s = t.senderId ? `${t.senderId.displayName} ${t.senderId.username} ${t.senderId.email}` : '';
        const r = t.receiverId ? `${t.receiverId.displayName} ${t.receiverId.username} ${t.receiverId.email}` : '';
        return (
          t.type.toLowerCase().includes(q) ||
          s.toLowerCase().includes(q) ||
          r.toLowerCase().includes(q)
        );
      })
    : transactions;

  res.status(200).json({
    status: 'success',
    transactions: filtered
  });
});

// Refund completed transaction (reverses coin balances and updates ledger)
exports.refundTransaction = catchAsync(async (req, res, next) => {
  const { transactionId } = req.params;

  const tx = await Transaction.findById(transactionId);
  if (!tx) {
    return next(new ApiError(404, 'Transaction not found'));
  }

  if (tx.status !== 'completed') {
    return next(new ApiError(400, 'Only completed transactions can be refunded'));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const systemSetting = await SystemSetting.findOne().session(session);
    const commRate = systemSetting ? systemSetting.commissionRate : 0.20;

    let netAmount = tx.amountCoins;
    if (['subscription', 'tip', 'gift', 'ppv_unlock', 'call_billing'].includes(tx.type)) {
      netAmount = tx.amountCoins * (1 - commRate);
    }

    // 1. Deduct net coins from receiver
    if (tx.receiverId) {
      let receiverWallet = await Wallet.findOne({ userId: tx.receiverId }).session(session);
      if (receiverWallet) {
        receiverWallet.balanceCoins = Number((receiverWallet.balanceCoins - netAmount).toFixed(2));
        await receiverWallet.save({ session, validateBeforeSave: false });
      }
    }

    // 2. Return original coins to sender
    if (tx.senderId) {
      let senderWallet = await Wallet.findOne({ userId: tx.senderId }).session(session);
      if (!senderWallet) {
        const [newWallet] = await Wallet.create([{ userId: tx.senderId, balanceCoins: 0 }], { session });
        senderWallet = newWallet;
      }
      senderWallet.balanceCoins = Number((senderWallet.balanceCoins + tx.amountCoins).toFixed(2));
      await senderWallet.save({ session, validateBeforeSave: false });
    }

    // 3. Update transaction status
    tx.status = 'refunded';
    await tx.save({ session, validateBeforeSave: false });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      message: 'Transaction successfully refunded and reversed',
      transaction: tx
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// Retrieve all withdrawal requests
exports.getWithdrawals = catchAsync(async (req, res, next) => {
  const { search, from, to } = req.query;

  const withdrawals = await Transaction.find({ type: 'withdrawal', ...buildDateRangeQuery(from, to) })
    .populate('senderId', 'username displayName email')
    .sort({ createdAt: -1 });

  const filtered = search
    ? withdrawals.filter((w) => {
        const q = search.toLowerCase();
        const s = w.senderId ? `${w.senderId.displayName} ${w.senderId.username} ${w.senderId.email}` : '';
        return s.toLowerCase().includes(q) || w.status.toLowerCase().includes(q);
      })
    : withdrawals;

  res.status(200).json({
    status: 'success',
    withdrawals: filtered
  });
});

// List promo codes (with the fans who redeemed each one)
exports.getPromoCodes = catchAsync(async (req, res, next) => {
  const settings = await SystemSetting.findOne().populate('promoCodes.redeemedBy', 'username displayName');
  res.status(200).json({
    status: 'success',
    promoCodes: settings ? settings.promoCodes : []
  });
});

// Coerce a value to a positive integer, or return null for "not set".
// Returns { value } on success or { error } with a message.
const parsePositiveInt = (value, label) => {
  if (value === undefined || value === null || value === '') return { value: null };
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) {
    return { error: `${label} must be a positive number` };
  }
  return { value: n };
};

// Create a promo code
exports.createPromoCode = catchAsync(async (req, res, next) => {
  const { code, bonusCoins, description, maxRedemptions, expiresAt, isActive } = req.body;

  if (!code || !String(code).trim()) {
    return next(new ApiError(400, 'Code is required'));
  }

  const bonus = parsePositiveInt(bonusCoins, 'Bonus coins');
  if (bonus.error) return next(new ApiError(400, bonus.error));
  if (bonus.value === null) return next(new ApiError(400, 'Bonus coins is required'));

  const maxRed = parsePositiveInt(maxRedemptions, 'Max redemptions');
  if (maxRed.error) return next(new ApiError(400, maxRed.error));

  let expiry = null;
  if (expiresAt) {
    expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime())) {
      return next(new ApiError(400, 'Expiry date is invalid'));
    }
  }

  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = await SystemSetting.create({ commissionRate: 0.20, coinPackages: [] });
  }

  const existing = settings.promoCodes.find(
    (p) => String(p.code).toLowerCase() === String(code).trim().toLowerCase()
  );
  if (existing) {
    return next(new ApiError(400, 'A promo code with this name already exists'));
  }

  settings.promoCodes.push({
    code: String(code).trim().toUpperCase(),
    bonusCoins: bonus.value,
    description: description || '',
    maxRedemptions: maxRed.value,
    expiresAt: expiry,
    isActive: isActive !== undefined ? isActive : true
  });
  await settings.save();

  res.status(201).json({
    status: 'success',
    promoCode: settings.promoCodes[settings.promoCodes.length - 1]
  });
});

// Update a promo code
exports.updatePromoCode = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const settings = await SystemSetting.findOne();
  if (!settings) {
    return next(new ApiError(404, 'No settings found'));
  }

  const promo = settings.promoCodes.id(id);
  if (!promo) {
    return next(new ApiError(404, 'Promo code not found'));
  }

  const { bonusCoins, description, maxRedemptions, expiresAt, isActive } = req.body;
  if (bonusCoins !== undefined) {
    const bonus = parsePositiveInt(bonusCoins, 'Bonus coins');
    if (bonus.error) return next(new ApiError(400, bonus.error));
    if (bonus.value === null) return next(new ApiError(400, 'Bonus coins is required'));
    promo.bonusCoins = bonus.value;
  }
  if (description !== undefined) promo.description = description;
  if (maxRedemptions !== undefined) {
    const maxRed = parsePositiveInt(maxRedemptions, 'Max redemptions');
    if (maxRed.error) return next(new ApiError(400, maxRed.error));
    promo.maxRedemptions = maxRed.value;
  }
  if (expiresAt !== undefined) {
    promo.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (promo.expiresAt && Number.isNaN(promo.expiresAt.getTime())) {
      return next(new ApiError(400, 'Expiry date is invalid'));
    }
  }
  if (isActive !== undefined) promo.isActive = isActive;

  await settings.save();

  res.status(200).json({
    status: 'success',
    promoCode: promo
  });
});

// Delete a promo code
exports.deletePromoCode = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const settings = await SystemSetting.findOne();
  if (!settings) {
    return next(new ApiError(404, 'No settings found'));
  }

  const promo = settings.promoCodes.id(id);
  if (!promo) {
    return next(new ApiError(404, 'Promo code not found'));
  }

  promo.remove();
  await settings.save();

  res.status(200).json({
    status: 'success',
    message: 'Promo code deleted'
  });
});

// Approve a pending withdrawal
exports.approveWithdrawal = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const tx = await Transaction.findById(id);
  if (!tx || tx.type !== 'withdrawal') {
    return next(new ApiError(404, 'Withdrawal request not found'));
  }

  if (tx.status !== 'pending') {
    return next(new ApiError(400, 'Withdrawal request is not pending'));
  }

  tx.status = 'completed';
  await tx.save();

  res.status(200).json({
    status: 'success',
    message: 'Withdrawal request approved successfully',
    transaction: tx
  });
});

// Reject a pending withdrawal and refund coins to creator
exports.rejectWithdrawal = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const tx = await Transaction.findById(id);
  if (!tx || tx.type !== 'withdrawal') {
    return next(new ApiError(404, 'Withdrawal request not found'));
  }

  if (tx.status !== 'pending') {
    return next(new ApiError(400, 'Withdrawal request is not pending'));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Return coins to creator
    let wallet = await Wallet.findOne({ userId: tx.senderId }).session(session);
    if (!wallet) {
      wallet = await Wallet.create([{ userId: tx.senderId, balanceCoins: 0 }], { session });
    }
    wallet.balanceCoins = Number((wallet.balanceCoins + tx.amountCoins).toFixed(2));
    await wallet.save({ session, validateBeforeSave: false });

    // 2. Mark transaction as failed
    tx.status = 'failed';
    await tx.save({ session, validateBeforeSave: false });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: 'success',
      message: 'Withdrawal request rejected and coins refunded to creator',
      transaction: tx
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
