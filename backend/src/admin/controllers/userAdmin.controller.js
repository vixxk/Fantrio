const User = require('../../models/User');
const CreatorProfile = require('../../models/CreatorProfile');
const Wallet = require('../../models/Wallet');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

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
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
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

// Update user details (Admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { email, username, displayName, role, isVerified } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'User not found'));
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
    return next(new ApiError(404, 'User not found'));
  }

  if (user.role === 'admin') {
    return next(new ApiError(400, 'Cannot suspend another administrator'));
  }

  user.isSuspended = !user.isSuspended;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `User account successfully ${user.isSuspended ? 'suspended' : 'activated'}`,
    isSuspended: user.isSuspended
  });
});

// Delete user and clean up all data
exports.deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  const Story = require('../../models/Story');
  const LiveStream = require('../../models/LiveStream');
  const Post = require('../../models/Post');
  const Subscription = require('../../models/Subscription');
  const Message = require('../../models/Message');
  const CallLog = require('../../models/CallLog');

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

  await User.findByIdAndDelete(userId);

  res.status(200).json({
    status: 'success',
    message: 'User and all associated data deleted successfully'
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
