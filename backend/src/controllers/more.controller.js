const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const Report = require('../models/Report');
const FeatureRequest = require('../models/FeatureRequest');
const Announcement = require('../models/Announcement');
const Referral = require('../models/Referral');
const Reward = require('../models/Reward');
const CallLog = require('../models/CallLog');
const CreatorProfile = require('../models/CreatorProfile');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { getHiddenUserIds } = require('../utils/blockFilter');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');

// ==========================================
// REWARD DEFINITIONS
// ==========================================
const REWARD_DEFINITIONS = [
  {
    type: 'first_deposit',
    title: 'First Wallet Recharge',
    description: 'Buy a coin pack to top up your wallet balance.',
    coins: 20,
    icon: 'card'
  },
  {
    type: 'referral_claimed',
    title: "Enter Friend's Referral Code",
    description: 'Support your friend and claim startup bonus.',
    coins: 50,
    icon: 'user'
  },
  {
    type: 'first_audio_call',
    title: 'Make 1:1 Audio Call',
    description: 'Initiate a call with any online creator.',
    coins: 30,
    icon: 'call'
  }
];

// Returns true if the current user has completed the reward's criteria.
const isRewardCompleted = async (type, userId) => {
  if (type === 'first_deposit') {
    const purchase = await Transaction.findOne({
      receiverId: userId,
      type: 'deposit',
      status: 'completed',
      gateway: { $nin: ['referral_bonus', 'reward_bonus', 'promo'] }
    });
    return !!purchase;
  }
  if (type === 'referral_claimed') {
    const referral = await Referral.findOne({ referredId: userId });
    return !!referral;
  }
  if (type === 'first_audio_call') {
    const call = await CallLog.findOne({
      $or: [{ callerId: userId }, { receiverId: userId }],
      type: 'audio',
      status: { $in: ['active', 'completed'] }
    });
    return !!call;
  }
  return false;
};

// ==========================================
// SUPPORT TICKETS
// ==========================================

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

  if (!['creator', 'content'].includes(targetType)) {
    return next(new ApiError(400, 'targetType must be "creator" or "content"'));
  }
  if (!targetId || !reason) {
    return next(new ApiError(400, 'targetId and reason are required'));
  }
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return next(new ApiError(400, 'Invalid target id'));
  }

  // Validate that the reported target actually exists
  if (targetType === 'creator') {
    const creator = await User.findOne({ _id: targetId, role: 'creator' });
    if (!creator) {
      return next(new ApiError(404, 'Creator not found'));
    }
    if (creator._id.toString() === req.user._id.toString()) {
      return next(new ApiError(400, 'You cannot report yourself'));
    }
  } else {
    const Post = require('../models/Post');
    const post = await Post.findById(targetId);
    if (!post) {
      return next(new ApiError(404, 'Content not found'));
    }
    if (post.creatorId.toString() === req.user._id.toString()) {
      return next(new ApiError(400, 'You cannot report your own content'));
    }
  }

  // Prevent duplicate reports from the same user against the same target
  const existing = await Report.findOne({
    reporterId: req.user._id,
    targetType,
    targetId
  });
  if (existing) {
    return next(new ApiError(400, 'You have already reported this. Our team will review it shortly.'));
  }

  const report = await Report.create({
    reporterId: req.user._id,
    targetType,
    targetId,
    reason,
    description: description || ''
  });

  res.status(201).json({
    status: 'success',
    report
  });
});

exports.getMyReports = catchAsync(async (req, res, next) => {
  const reports = await Report.find({ reporterId: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    reports
  });
});

exports.getMyAllIssues = catchAsync(async (req, res, next) => {
  const [tickets, reports] = await Promise.all([
    SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 }),
    Report.find({ reporterId: req.user._id }).sort({ createdAt: -1 })
  ]);

  // Combine into a single normalized issue timeline if needed
  const combined = [
    ...tickets.map(t => ({
      _id: t._id,
      issueType: 'ticket',
      subject: t.subject,
      details: t.message,
      category: t.category,
      status: t.status, // open | in-progress | closed
      reply: t.reply || '',
      repliedAt: t.repliedAt || null,
      createdAt: t.createdAt
    })),
    ...reports.map(r => ({
      _id: r._id,
      issueType: 'report',
      subject: `Safety Report: ${r.reason}`,
      details: r.description || `Reported ${r.targetType} (${r.targetId})`,
      targetType: r.targetType,
      targetId: r.targetId,
      category: 'safety_report',
      status: r.status, // pending | reviewed | resolved
      reply: r.reply || '',
      repliedAt: r.repliedAt || null,
      createdAt: r.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    status: 'success',
    tickets,
    reports,
    issues: combined
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

  const isAdmin = req.user.role === 'admin';

  const feature = await FeatureRequest.create({
    userId: req.user._id,
    title,
    description,
    isApproved: isAdmin, // auto-approve if submitted by admin, else requires approval
    votes: [req.user._id] // creator upvotes by default
  });

  res.status(201).json({
    status: 'success',
    feature
  });
});

exports.getFeatureRequests = catchAsync(async (req, res, next) => {
  const userIdStr = req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  // Approved features OR user's own feature OR all features for admin
  const filter = isAdmin
    ? {}
    : {
        $or: [
          { isApproved: { $ne: false } },
          { userId: req.user._id }
        ]
      };

  const features = await FeatureRequest.find(filter)
    .populate('userId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });

  const data = features.map((f) => ({
    ...f.toObject(),
    votesCount: f.votes.length,
    hasVoted: f.votes.some((v) => v.toString() === userIdStr)
  }));

  res.status(200).json({
    status: 'success',
    features: data
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

  let user = await User.findById(req.user._id);
  if (!user.referralCode || !/^[A-Z]{4}$/.test(user.referralCode)) {
    user.referralCode = null;
    await user.save({ validateBeforeSave: false });
  }
  const referralCode = user.referralCode;

  // Find if current user has been referred by someone else
  const referredBy = await Referral.findOne({ referredId: req.user._id }).populate('referrerId', 'username displayName referralCode');

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

  const cleanCode = code.trim().toUpperCase();

  let user = await User.findById(req.user._id);
  if (!user.referralCode || !/^[A-Z]{4}$/.test(user.referralCode)) {
    user.referralCode = null;
    await user.save({ validateBeforeSave: false });
  }

  // Prevent claiming own code
  if (cleanCode === user.referralCode || (user.username && cleanCode === user.username.toUpperCase())) {
    return next(new ApiError(400, 'You cannot claim your own referral code'));
  }

  // Find referrer by referralCode (or fallback to username)
  let referrer = await User.findOne({ referralCode: cleanCode });
  if (!referrer) {
    referrer = await User.findOne({ username: cleanCode.toLowerCase() });
  }
  if (!referrer) {
    return next(new ApiError(404, 'Referral code not found'));
  }

  if (referrer._id.toString() === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot claim your own referral code'));
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

// ==========================================
// REWARDS & MILESTONES
// ==========================================
exports.getRewards = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userIdStr = userId.toString();

  // Load already-granted rewards for this user
  const granted = await Reward.find({ userId });
  const grantedMap = {};
  granted.forEach((r) => {
    grantedMap[r.type] = r;
  });

  const rewards = [];
  for (const def of REWARD_DEFINITIONS) {
    const completed = await isRewardCompleted(def.type, userId);

    // Grant coins the first time a reward is completed.
    // Note: referral_claimed coins are already credited by the referral
    // claim flow, so it is only marked as granted here (no double credit).
    let claimed = !!grantedMap[def.type];
    if (completed && !claimed) {
      const grantCoins = def.type === 'referral_claimed' ? 0 : def.coins;
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = await Wallet.create({ userId, balanceCoins: 0 });
      }

      if (grantCoins > 0) {
        wallet.balanceCoins = Number((wallet.balanceCoins + grantCoins).toFixed(2));
        await wallet.save();

        await Transaction.create({
          senderId: null,
          receiverId: userId,
          type: 'deposit',
          status: 'completed',
          amountCoins: grantCoins,
          gateway: 'reward_bonus',
          metadata: { rewardType: def.type }
        });
      }

      const record = await Reward.create({
        userId,
        type: def.type,
        coins: def.coins
      });
      grantedMap[def.type] = record;
      claimed = true;
    }

    rewards.push({
      type: def.type,
      title: def.title,
      description: def.description,
      coins: def.coins,
      icon: def.icon,
      completed,
      claimed,
      grantedAt: claimed && grantedMap[def.type] ? grantedMap[def.type].grantedAt : null
    });
  }

  res.status(200).json({
    status: 'success',
    rewards
  });
});

// ==========================================
// REPORT SUPPORT DATA
// ==========================================
// Lightweight list of reportable creators for the "Report A Creator" form.
exports.getReportCreators = catchAsync(async (req, res, next) => {
  const hiddenIds = await getHiddenUserIds(req.user._id);

  const filter = { verificationStatus: 'approved', userId: { $nin: [...hiddenIds, req.user._id] } };

  const creators = await CreatorProfile.find(filter)
    .select('userId username displayName avatarUrl followerCount')
    .sort({ followerCount: -1 })
    .limit(200)
    .lean();

  res.status(200).json({
    status: 'success',
    creators: creators.map((c) => ({
      userId: c.userId,
      username: c.username,
      displayName: c.displayName || c.username,
      avatarUrl: c.avatarUrl || ''
    }))
  });
});
