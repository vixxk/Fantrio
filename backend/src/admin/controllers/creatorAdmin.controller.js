const CreatorProfile = require('../../models/CreatorProfile');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// List all creators (Admin only)
exports.getCreatorsList = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  let profiles = await CreatorProfile.find()
    .populate('userId', 'username email role displayName createdAt')
    .sort({ createdAt: -1 });

  if (search) {
    const q = search.toLowerCase();
    profiles = profiles.filter((p) => {
      const u = p.userId;
      if (!u) return false;
      return (
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    });
  }

  res.status(200).json({
    status: 'success',
    profiles
  });
});

// Update creator profile settings (Admin only)
exports.updateCreatorProfile = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params; // creator's userId
  const { bio, categories, rates, followerCount, subscriberCount, rating, isOnline, isLive } = req.body;

  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  if (bio !== undefined) profile.bio = bio;
  if (categories !== undefined) profile.categories = categories;
  if (rates !== undefined) profile.rates = rates;
  if (followerCount !== undefined) profile.followerCount = followerCount;
  if (subscriberCount !== undefined) profile.subscriberCount = subscriberCount;
  if (rating !== undefined) profile.rating = rating;
  if (isOnline !== undefined) profile.isOnline = isOnline;
  if (isLive !== undefined) profile.isLive = isLive;

  await profile.save();

  res.status(200).json({
    status: 'success',
    profile
  });
});

// Approve creator account
exports.approveCreator = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;

  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  profile.verificationStatus = 'approved';
  profile.isVerifiedBadge = true;
  await profile.save();

  res.status(200).json({
    status: 'success',
    message: 'Creator application approved',
    profile
  });
});

// Reject creator account
exports.rejectCreator = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;

  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  profile.verificationStatus = 'rejected';
  profile.isVerifiedBadge = false;
  await profile.save();

  res.status(200).json({
    status: 'success',
    message: 'Creator application rejected',
    profile
  });
});

// Toggle creator verification badge
exports.toggleCreatorVerification = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;

  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  profile.isVerifiedBadge = !profile.isVerifiedBadge;
  await profile.save();

  res.status(200).json({
    status: 'success',
    message: `Verification badge ${profile.isVerifiedBadge ? 'granted' : 'revoked'}`,
    profile
  });
});
