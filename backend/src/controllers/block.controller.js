const User = require('../models/User');
const CreatorProfile = require('../models/CreatorProfile');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Block another user (creator/fan). Automatically unfollows them.
exports.blockUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot block yourself'));
  }

  const target = await User.findById(userId);
  if (!target) {
    return next(new ApiError(404, 'User not found'));
  }

  if (target.role === 'admin') {
    return next(new ApiError(400, 'You cannot block an administrator'));
  }

  if (req.user.blockedUsers.includes(userId)) {
    return res.status(200).json({
      status: 'success',
      message: 'User is already blocked',
      isBlocked: true
    });
  }

  // Unfollow the blocked user (and clean up their follower count)
  const wasFollowing = req.user.following.includes(userId);
  if (wasFollowing) {
    req.user.following.pull(userId);
    await CreatorProfile.updateOne(
      { userId },
      { $inc: { followerCount: -1 } }
    );
    // Enforce non-negative follower count
    await CreatorProfile.updateOne(
      { userId, followerCount: { $lt: 0 } },
      { $set: { followerCount: 0 } }
    );
  }

  req.user.blockedUsers.push(userId);
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'User blocked successfully',
    isBlocked: true
  });
});

// Unblock a previously blocked user
exports.unblockUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!req.user.blockedUsers.includes(userId)) {
    return res.status(200).json({
      status: 'success',
      message: 'User is not currently blocked',
      isBlocked: false
    });
  }

  req.user.blockedUsers.pull(userId);
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'User unblocked successfully',
    isBlocked: false
  });
});

// List all users the current user has blocked
exports.getBlockedUsers = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('blockedUsers', 'username displayName avatarUrl role');

  res.status(200).json({
    status: 'success',
    blockedUsers: user.blockedUsers
  });
});
