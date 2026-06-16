const CreatorProfile = require('../models/CreatorProfile');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const SystemSetting = require('../models/SystemSetting');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Update creator profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const profile = await CreatorProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found.'));
  }

  const {
    username,
    displayName,
    bio,
    categories,
    avatarUrl,
    coverBannerUrl,
    rates,
    seoTags
  } = req.body;

  // Handle username update if provided and different
  if (username && username.toLowerCase() !== profile.username) {
    const cleanUsername = username.trim().toLowerCase();
    
    // Alphanumeric validation (already validated by Schema, but double check)
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return next(new ApiError(400, 'Username can only contain letters, numbers, and underscores.'));
    }

    // Check availability
    const taken = await CreatorProfile.findOne({ username: cleanUsername });
    if (taken) {
      return next(new ApiError(400, 'Username is already taken.'));
    }

    profile.username = cleanUsername;
  }

  // Update optional fields
  if (displayName !== undefined) profile.displayName = displayName;
  if (bio !== undefined) profile.bio = bio;
  if (categories !== undefined) profile.categories = categories;
  if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
  if (coverBannerUrl !== undefined) profile.coverBannerUrl = coverBannerUrl;

  // Update rates
  if (rates) {
    if (rates.subscriptionMonthly !== undefined) profile.rates.subscriptionMonthly = rates.subscriptionMonthly;
    if (rates.audioCallPerMin !== undefined) profile.rates.audioCallPerMin = rates.audioCallPerMin;
    if (rates.videoCallPerMin !== undefined) profile.rates.videoCallPerMin = rates.videoCallPerMin;
  }

  // Update SEO Tags
  if (seoTags) {
    if (seoTags.metaTitle !== undefined) profile.seoTags.metaTitle = seoTags.metaTitle;
    if (seoTags.metaDescription !== undefined) profile.seoTags.metaDescription = seoTags.metaDescription;
    if (seoTags.openGraphTags !== undefined) {
      // openGraphTags is a Map
      profile.seoTags.openGraphTags = new Map(Object.entries(seoTags.openGraphTags));
    }
  }

  await profile.save();

  res.status(200).json({
    status: 'success',
    profile
  });
});

// Fetch SEO-optimized public profile
exports.getPublicProfile = catchAsync(async (req, res, next) => {
  const { username } = req.params;

  const profile = await CreatorProfile.findOne({ username: username.toLowerCase() })
    .populate('userId', 'email isVerified');

  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found.'));
  }

  // Generate structured SEO metadata tags
  const ogTitle = (profile.seoTags && profile.seoTags.openGraphTags && profile.seoTags.openGraphTags.get('og:title')) ||
                  (profile.seoTags && profile.seoTags.metaTitle) ||
                  `${profile.displayName || profile.username} on Fantrio`;

  const ogDescription = (profile.seoTags && profile.seoTags.openGraphTags && profile.seoTags.openGraphTags.get('og:description')) ||
                        (profile.seoTags && profile.seoTags.metaDescription) ||
                        profile.bio ||
                        `Subscribe to see exclusive content from ${profile.displayName || profile.username}.`;

  const ogImage = (profile.seoTags && profile.seoTags.openGraphTags && profile.seoTags.openGraphTags.get('og:image')) ||
                  profile.avatarUrl ||
                  '';

  res.status(200).json({
    status: 'success',
    creator: profile,
    seoTags: {
      title: (profile.seoTags && profile.seoTags.metaTitle) || `${profile.displayName || profile.username} (@${profile.username}) | Fantrio`,
      description: (profile.seoTags && profile.seoTags.metaDescription) || profile.bio || `Check out ${profile.displayName || profile.username}'s exclusive content.`,
      ogTitle,
      ogDescription,
      ogImage
    }
  });
});

// Discover and search creators
exports.discoverCreators = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const skip = (page - 1) * limit;

  const filter = {};

  // Apply search query
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { username: searchRegex },
      { displayName: searchRegex }
    ];
  }

  // Apply category filtering
  if (req.query.category) {
    filter.categories = req.query.category;
  }

  const creators = await CreatorProfile.find(filter)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'email isVerified');

  const total = await CreatorProfile.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    creators,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Get trending creators
exports.getTrending = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit || '5', 10);

  // Sort by subscriberCount and followerCount descending
  const creators = await CreatorProfile.find()
    .sort({ subscriberCount: -1, followerCount: -1 })
    .limit(limit)
    .populate('userId', 'email isVerified');

  res.status(200).json({
    status: 'success',
    creators
  });
});

// Follow / Unfollow Creator
exports.followCreator = catchAsync(async (req, res, next) => {
  const { creatorId } = req.params;

  if (creatorId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot follow yourself.'));
  }

  // Find creator profile
  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found.'));
  }

  const user = await User.findById(req.user._id);

  // Check if already following
  const isFollowing = user.following.includes(creatorId);

  if (isFollowing) {
    // Unfollow
    user.following.pull(creatorId);
    profile.followerCount = Math.max(0, profile.followerCount - 1);
  } else {
    // Follow
    user.following.push(creatorId);
    profile.followerCount += 1;
  }

  await user.save({ validateBeforeSave: false });
  await profile.save();

  res.status(200).json({
    status: 'success',
    following: !isFollowing
  });
});

// Retrieve followed/favourite creators
exports.getFavourites = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  const creators = await CreatorProfile.find({
    userId: { $in: user.following }
  }).populate('userId', 'email isVerified');

  res.status(200).json({
    status: 'success',
    creators
  });
});

// Retrieve subscribed creators ribbon
exports.getSubscribed = catchAsync(async (req, res, next) => {
  const subscriptions = await Subscription.find({
    userId: req.user._id,
    status: 'active',
    expiryDate: { $gt: new Date() }
  });

  const creatorIds = subscriptions.map(sub => sub.creatorId);

  const creators = await CreatorProfile.find({
    userId: { $in: creatorIds }
  }).populate('userId', 'email isVerified');

  res.status(200).json({
    status: 'success',
    creators
  });
});

// Creator Analytics Dashboard
exports.getCreatorDashboard = catchAsync(async (req, res, next) => {
  const profile = await CreatorProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  // Retrieve all completed payouts / earnings
  const transactions = await Transaction.find({
    receiverId: req.user._id,
    status: 'completed'
  });

  // Retrieve dynamic platform settings
  const systemSetting = await SystemSetting.findOne();
  const commRate = systemSetting ? systemSetting.commissionRate : 0.20;

  let totalEarnings = 0;
  let subscriptionEarnings = 0;
  let tipEarnings = 0;
  let ppvEarnings = 0;
  let callEarnings = 0;

  for (const tx of transactions) {
    let creatorShare = tx.amountCoins;
    // Apply system fee deduction
    if (['subscription', 'tip', 'ppv_unlock', 'call_billing'].includes(tx.type)) {
      creatorShare = tx.amountCoins * (1 - commRate);
    }
    
    totalEarnings += creatorShare;
    
    if (tx.type === 'subscription') {
      subscriptionEarnings += creatorShare;
    } else if (tx.type === 'tip') {
      tipEarnings += creatorShare;
    } else if (tx.type === 'ppv_unlock') {
      ppvEarnings += creatorShare;
    } else if (tx.type === 'call_billing') {
      callEarnings += creatorShare;
    }
  }

  // Fan Analytics (highest spenders)
  const fanAnalytics = await Transaction.aggregate([
    {
      $match: {
        receiverId: req.user._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$senderId',
        totalSpent: { $sum: '$amountCoins' },
        txCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalSpent: -1 }
    }
  ]);

  const populatedFans = await User.populate(fanAnalytics, {
    path: '_id',
    select: 'username displayName avatarUrl email'
  });

  res.status(200).json({
    status: 'success',
    analytics: {
      subscribersCount: profile.subscriberCount,
      followersCount: profile.followerCount,
      earnings: {
        totalCoins: Number(totalEarnings.toFixed(2)),
        byCategory: {
          subscriptions: Number(subscriptionEarnings.toFixed(2)),
          tips: Number(tipEarnings.toFixed(2)),
          ppv: Number(ppvEarnings.toFixed(2)),
          calls: Number(callEarnings.toFixed(2))
        }
      },
      fans: populatedFans
    }
  });
});
