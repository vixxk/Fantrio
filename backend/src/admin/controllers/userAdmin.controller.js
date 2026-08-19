const mongoose = require('mongoose');
const User = require('../../models/User');
const CreatorProfile = require('../../models/CreatorProfile');
const Wallet = require('../../models/Wallet');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');

// Fetch all users with search, role, suspension, and period filters
exports.getUsersList = catchAsync(async (req, res, next) => {
  const { search, role, status, from, to } = req.query;
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

  // Period filter (inclusive YYYY-MM-DD range on the account creation date)
  Object.assign(query, buildDateRangeQuery(from, to));

  if (search && search.trim()) {
    const regex = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    query.$or = [
      { email: regex },
      { username: regex },
      { displayName: regex },
      { bio: regex },
      { referralCode: regex },
      { role: regex }
    ];
  }

  const users = await User.find(query)
    .select('-password -otp')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  // Enrich every user with their wallet balance and block-list size so the admin
  // panel can show the full listener picture (wallet, status, activity).
  const userIds = users.map((u) => u._id);
  const wallets = userIds.length
    ? await Wallet.find({ userId: { $in: userIds } }).select('userId balanceCoins').lean()
    : [];
  const walletMap = {};
  wallets.forEach((w) => { walletMap[String(w.userId)] = w.balanceCoins || 0; });

  const enriched = users.map((u) => {
    const plain = u.toObject ? u.toObject() : u;
    return {
      ...plain,
      walletBalanceCoins: walletMap[String(u._id)] || 0,
      blockedCount: (u.blockedUsers || []).length
    };
  });

  res.status(200).json({
    status: 'success',
    total,
    page,
    limit,
    users: enriched
  });
});

// Update user details (Admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { email, username, displayName, role, isVerified } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  if (email) user.email = email;
  if (username) user.username = username;
  if (displayName) user.displayName = displayName;
  if (role) user.role = role;
  if (isVerified !== undefined) user.isVerified = isVerified;

  await user.save();

  res.status(200).json({
    status: 'success',
    user
  });
});

// Suspend or lift suspension on a user
exports.toggleUserSuspension = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  if (user.role === 'admin') {
    return next(new ApiError(400, 'Cannot suspend another administrator'));
  }

  user.isSuspended = !user.isSuspended;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Fan account successfully ${user.isSuspended ? 'suspended' : 'activated'}`,
    isSuspended: user.isSuspended
  });
});

// Delete user and clean up all data — including removing any media the user
// uploaded to cloud storage (stories, posts, chat attachments) so deleting an account
// doesn't leave orphaned files behind.
exports.deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  const Story = require('../../models/Story');
  const LiveStream = require('../../models/LiveStream');
  const Post = require('../../models/Post');
  const Subscription = require('../../models/Subscription');
  const Message = require('../../models/Message');
  const CallLog = require('../../models/CallLog');
  const awsService = require('../../services/aws.service');

  // Collect every hosted media URL the user owns so we can purge the files after the
  // database records are removed. deleteS3Media skips external (seeded) URLs.
  const [stories, posts, messages, streams] = await Promise.all([
    Story.find({ creatorId: userId }).select('mediaUrl').lean(),
    Post.find({ creatorId: userId }).select('media').lean(),
    Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      mediaUrl: { $ne: '' }
    }).select('mediaUrl').lean(),
    LiveStream.find({ creatorId: userId }).select('coverUrl').lean()
  ]);

  const mediaUrls = [];
  stories.forEach((s) => mediaUrls.push(s.mediaUrl));
  posts.forEach((p) => {
    (p.media || []).forEach((m) => {
      mediaUrls.push(m.url);
      if (m.thumbnailUrl) mediaUrls.push(m.thumbnailUrl);
    });
  });
  messages.forEach((msg) => mediaUrls.push(msg.mediaUrl));
  streams.forEach((s) => mediaUrls.push(s.coverUrl));

  await CreatorProfile.findOneAndDelete({ userId });
  await Story.deleteMany({ creatorId: userId });
  await LiveStream.deleteMany({ creatorId: userId });
  await Wallet.findOneAndDelete({ userId });
  await Post.deleteMany({ creatorId: userId });
  
  await Subscription.deleteMany({
    $or: [{ userId }, { creatorId: userId }]
  });

  await Message.deleteMany({
    $or: [{ senderId: userId }, { receiverId: userId }]
  });

  await CallLog.deleteMany({
    $or: [{ callerId: userId }, { receiverId: userId }]
  });

  // Purge the user's media from cloud storage (best-effort; external URLs are skipped).
  await awsService.deleteS3Media(mediaUrls);

  await User.findByIdAndDelete(userId);

  res.status(200).json({
    status: 'success',
    message: 'Fan and all associated data deleted successfully'
  });
});

// Adjust user wallet balance
exports.adjustUserBalance = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { amountCoins } = req.body;

  if (amountCoins === undefined || isNaN(amountCoins)) {
    return next(new ApiError(400, 'Please provide a valid coin amount'));
  }

  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId, balanceCoins: 0 });
  }

  wallet.balanceCoins = Number((wallet.balanceCoins + amountCoins).toFixed(2));
  if (wallet.balanceCoins < 0) {
    wallet.balanceCoins = 0;
  }
  await wallet.save();

  res.status(200).json({
    status: 'success',
    message: `Wallet balance adjusted by ${amountCoins} coins. New balance is ${wallet.balanceCoins} coins.`,
    balanceCoins: wallet.balanceCoins
  });
});

// Aggregated listener activity: subscriptions, transactions, posts, calls, blocked list.
// Powers the admin user-detail drawer so a moderator sees a user's full footprint.
exports.getUserActivity = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ApiError(400, 'Invalid user id'));
  }

  const Subscription = require('../../models/Subscription');
  const Transaction = require('../../models/Transaction');
  const Post = require('../../models/Post');
  const CallLog = require('../../models/CallLog');

  const [subscriptions, transactions, posts, calls, blockedUser] = await Promise.all([
    Subscription.find({ userId })
      .populate('creatorId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Transaction.find({ $or: [{ senderId: userId }, { receiverId: userId }] })
      .populate('senderId', 'username displayName avatarUrl')
      .populate('receiverId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    Post.find({ creatorId: userId })
      .select('content media postType coinPrice likes commentCount sharesCount isPublished isHidden createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    CallLog.find({ $or: [{ callerId: userId }, { receiverId: userId }] })
      .populate('callerId', 'username displayName avatarUrl')
      .populate('receiverId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    User.findById(userId)
      .select('blockedUsers')
      .populate('blockedUsers', 'username displayName avatarUrl email role')
      .lean()
  ]);

  res.status(200).json({
    status: 'success',
    activity: {
      subscriptions,
      transactions,
      posts,
      calls,
      blockedUsers: (blockedUser && blockedUser.blockedUsers) || []
    }
  });
});

// List users that a given user has blocked
exports.getUserBlockedList = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .populate('blockedUsers', 'username displayName avatarUrl role email');

  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  res.status(200).json({
    status: 'success',
    blockedUsers: user.blockedUsers
  });
});

// Admin force-unblock: remove a blocked user relationship
exports.adminUnblockUser = catchAsync(async (req, res, next) => {
  const { userId, blockedId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  if (!user.blockedUsers.includes(blockedId)) {
    return next(new ApiError(400, 'This fan is not currently blocked'));
  }

  user.blockedUsers.pull(blockedId);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Block removed successfully',
    isBlocked: false
  });
});
