const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
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

// Retrieve transaction history
exports.getTransactions = catchAsync(async (req, res, next) => {
  const transactions = await Transaction.find({
    $or: [
      { senderId: req.user._id },
      { receiverId: req.user._id }
    ]
  })
  .populate('senderId', 'username displayName')
  .populate('receiverId', 'username displayName')
  .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    transactions
  });
});

// Developer helper: Add mock coins to wallet
exports.addMockCoins = catchAsync(async (req, res, next) => {
  const { coins } = req.body;

  if (!coins || coins <= 0) {
    return next(new ApiError(400, 'Please specify positive number of coins to credit'));
  }

  let wallet = await Wallet.findOne({ userId: req.user._id });
  if (!wallet) {
    wallet = await Wallet.create({ userId: req.user._id, balanceCoins: 0 });
  }

  wallet.balanceCoins = Number((wallet.balanceCoins + coins).toFixed(2));
  await wallet.save();

  // Log deposit transaction
  await Transaction.create({
    senderId: null,
    receiverId: req.user._id,
    type: 'deposit',
    status: 'completed',
    amountCoins: coins,
    gateway: 'internal'
  });

  res.status(200).json({
    status: 'success',
    message: `${coins} mock coins credited to your wallet`,
    balanceCoins: wallet.balanceCoins
  });
});
