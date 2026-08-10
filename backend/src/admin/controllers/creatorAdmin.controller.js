const CreatorProfile = require('../../models/CreatorProfile');
const User = require('../../models/User');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');

// List all creators (Admin only)
exports.getCreatorsList = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  const { search, status, verificationStatus, from, to } = req.query;

  const filter = {};

  if (status === 'online') filter.isOnline = true;
  else if (status === 'live') filter.isLive = true;

  if (verificationStatus && ['pending', 'approved', 'rejected'].includes(verificationStatus)) {
    filter.verificationStatus = verificationStatus;
  }

  // Period filter: match on the account creation date (the "Joined" column)
  const dateRange = buildDateRangeQuery(from, to);
  if (dateRange.createdAt) {
    const matchedUsers = await User.find({ createdAt: dateRange.createdAt }).select('_id').lean();
    filter.userId = { $in: matchedUsers.map((u) => u._id) };
  }

  let profilesQuery = CreatorProfile.find(filter)
    .populate('userId', 'username email role displayName avatarUrl createdAt')
    .sort({ createdAt: -1 });

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    const profileIds = await CreatorProfile.find(filter)
      .populate('userId', 'username email displayName avatarUrl')
      .then((all) =>
        all
          .filter((p) => {
            const u = p.userId;
            if (!u) return false;
            return (
              (u.displayName && u.displayName.toLowerCase().includes(q)) ||
              (u.username && u.username.toLowerCase().includes(q)) ||
              (u.email && u.email.toLowerCase().includes(q)) ||
              (p.categories || []).some((c) => String(c).toLowerCase().includes(q))
            );
          })
          .map((p) => p._id)
      );
    filter._id = { $in: profileIds };
    profilesQuery = CreatorProfile.find(filter)
      .populate('userId', 'username email role displayName avatarUrl createdAt')
      .sort({ createdAt: -1 });
  }

  const [profiles, total] = await Promise.all([
    profilesQuery.skip(skip).limit(limit),
    CreatorProfile.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    profiles,
    total,
    page,
    totalPages: Math.ceil(total / limit)
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
  // Merge, never replace: the rates subdocument also holds subscriptionMonthly,
  // which the listener Subscriptions page reads. A full replacement would wipe it.
  if (rates !== undefined) profile.rates = { ...(profile.rates || {}), ...rates };
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
