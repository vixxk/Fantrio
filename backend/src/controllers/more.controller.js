const SupportTicket = require('../models/SupportTicket');
const Report = require('../models/Report');
const FeatureRequest = require('../models/FeatureRequest');
const Announcement = require('../models/Announcement');
const Referral = require('../models/Referral');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');

// ==========================================
// SUPPORT TICKETS
// ==========================================
exports.createTicket = catchAsync(async (req, res, next) => {
  const { subject, message, category } = req.body;

  if (!subject || !message) {
    return next(new ApiError(400, 'Subject and message are required'));
  }

  const ticket = await SupportTicket.create({
    userId: req.user._id,
    subject,
    message,
    category: category || 'general'
  });

  res.status(201).json({
    status: 'success',
    ticket
  });
});

exports.getMyTickets = catchAsync(async (req, res, next) => {
  const tickets = await SupportTicket.find({ userId: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    tickets
  });
});

// ==========================================
// REPORTS
// ==========================================
exports.createReport = catchAsync(async (req, res, next) => {
  const { targetType, targetId, reason, description } = req.body;

  if (!targetType || !targetId || !reason) {
    return next(new ApiError(400, 'targetType, targetId, and reason are required'));
  }

  const report = await Report.create({
    reporterId: req.user._id,
    targetType,
    targetId,
    reason,
    description
  });

  res.status(201).json({
    status: 'success',
    report
  });
});

// ==========================================
// FEATURE REQUESTS
// ==========================================
exports.createFeatureRequest = catchAsync(async (req, res, next) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return next(new ApiError(400, 'Title and description are required'));
  }

  const feature = await FeatureRequest.create({
    userId: req.user._id,
    title,
    description,
    votes: [req.user._id] // creator upvotes by default
  });

  res.status(201).json({
    status: 'success',
    feature
  });
});

exports.getFeatureRequests = catchAsync(async (req, res, next) => {
  const features = await FeatureRequest.find()
    .populate('userId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    features
  });
});

exports.voteFeatureRequest = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const feature = await FeatureRequest.findById(id);

  if (!feature) {
    return next(new ApiError(404, 'Feature request not found'));
  }

  const userIdStr = req.user._id.toString();
  const index = feature.votes.findIndex(v => v.toString() === userIdStr);

  if (index > -1) {
    // Remove vote (downvote)
    feature.votes.splice(index, 1);
  } else {
    // Add vote
    feature.votes.push(req.user._id);
  }

  await feature.save();

  res.status(200).json({
    status: 'success',
    votesCount: feature.votes.length,
    hasVoted: index === -1
  });
});

// ==========================================
// ANNOUNCEMENTS
// ==========================================
exports.getAnnouncements = catchAsync(async (req, res, next) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    announcements
  });
});

// ==========================================
// REFERRALS & REWARDS
// ==========================================
exports.getReferralStats = catchAsync(async (req, res, next) => {
  const referredCount = await Referral.countDocuments({ referrerId: req.user._id });
  const referralCode = req.user.username ? req.user.username.toUpperCase() : req.user._id.toString().slice(-6).toUpperCase();

  // Find if current user has been referred by someone else
  const referredBy = await Referral.findOne({ referredId: req.user._id }).populate('referrerId', 'username displayName');

  res.status(200).json({
    status: 'success',
    referralCode,
    referredCount,
    claimed: !!referredBy,
    referredBy: referredBy ? referredBy.referrerId : null
  });
});

exports.claimReferral = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return next(new ApiError(400, 'Referral code is required'));
  }

  const cleanCode = code.trim().toLowerCase();

  // Prevent claiming own code
  if (req.user.username && cleanCode === req.user.username.toLowerCase()) {
    return next(new ApiError(400, 'You cannot claim your own referral code'));
  }

  // Find referrer
  const referrer = await User.findOne({ username: cleanCode });
  if (!referrer) {
    return next(new ApiError(404, 'Referral code not found'));
  }

  // Check if current user has already claimed a referral
  const existingReferral = await Referral.findOne({ referredId: req.user._id });
  if (existingReferral) {
    return next(new ApiError(400, 'You have already claimed a referral code'));
  }

  // Create referral record
  const referral = await Referral.create({
    referrerId: referrer._id,
    referredId: req.user._id,
    rewardGranted: true
  });

  // Credit referrer: 100 coins
  let referrerWallet = await Wallet.findOne({ userId: referrer._id });
  if (!referrerWallet) {
    referrerWallet = await Wallet.create({ userId: referrer._id, balanceCoins: 0 });
  }
  referrerWallet.balanceCoins = Number((referrerWallet.balanceCoins + 100).toFixed(2));
  await referrerWallet.save();

  await Transaction.create({
    senderId: null,
    receiverId: referrer._id,
    type: 'deposit',
    status: 'completed',
    amountCoins: 100,
    gateway: 'referral_bonus'
  });

  // Credit referred user (current user): 50 coins
  let userWallet = await Wallet.findOne({ userId: req.user._id });
  if (!userWallet) {
    userWallet = await Wallet.create({ userId: req.user._id, balanceCoins: 0 });
  }
  userWallet.balanceCoins = Number((userWallet.balanceCoins + 50).toFixed(2));
  await userWallet.save();

  await Transaction.create({
    senderId: null,
    receiverId: req.user._id,
    type: 'deposit',
    status: 'completed',
    amountCoins: 50,
    gateway: 'referral_bonus'
  });

  res.status(200).json({
    status: 'success',
    message: 'Referral claimed successfully! You received 50 coins, and your friend received 100 coins.',
    rewardGranted: true
  });
});
