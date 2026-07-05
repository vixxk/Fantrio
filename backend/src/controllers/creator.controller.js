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

  // Sync to User model for populates
  const user = await User.findById(req.user._id);
  if (user) {
    user.username = profile.username;
    user.displayName = profile.displayName;
    user.avatarUrl = profile.avatarUrl;
    await user.save({ validateBeforeSave: false });
  }

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
  const limit = parseInt(req.query.limit || '12', 10); // Default to 12 as per the 4-column layout
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
  if (req.query.category && req.query.category !== 'All Categories') {
    filter.categories = req.query.category;
  }

  // Availability filters
  if (req.query.isOnline === 'true') {
    filter.isOnline = true;
  }
  if (req.query.isLive === 'true') {
    filter.isLive = true;
  }
  if (req.query.audioAvailable === 'true') {
    filter.audioAvailable = true;
  }
  if (req.query.videoAvailable === 'true') {
    filter.videoAvailable = true;
  }

  // Content type filters
  if (req.query.contentType) {
    // Expected to be a single string or comma-separated list
    const types = req.query.contentType.split(',');
    filter.contentType = { $in: types };
  }

  // Country & Language
  if (req.query.country && req.query.country !== 'All Countries') {
    filter.country = req.query.country;
  }
  if (req.query.language && req.query.language !== 'All Languages') {
    filter.language = req.query.language;
  }

  // Follower range filter
  if (req.query.minFollowers || req.query.maxFollowers) {
    filter.followerCount = {};
    if (req.query.minFollowers) {
      filter.followerCount.$gte = parseInt(req.query.minFollowers, 10);
    }
    if (req.query.maxFollowers) {
      filter.followerCount.$lte = parseInt(req.query.maxFollowers, 10);
    }
  }

  // Sorting
  let sortOption = { followerCount: -1 }; // default: popularity
  if (req.query.sortBy === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (req.query.sortBy === 'rating') {
    sortOption = { rating: -1 };
  }

  const creators = await CreatorProfile.find(filter)
    .sort(sortOption)
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

// Fetch Active Stories
exports.getStories = catchAsync(async (req, res, next) => {
  const dbCreators = await CreatorProfile.find();
  
  const mockAvatars = [
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80'
  ];
  
  const mockNames = [
    'Jessica', 'Emily', 'Sophia', 'Angelina', 'Mia', 
    'Luna', 'Emmy', 'Ava', 'Charlotte', 'Harper', 
    'Amelia', 'Evelyn', 'Abigail', 'Ella', 'Elizabeth',
    'Camila', 'Scarlett', 'Victoria', 'Madison', 'Grace'
  ];

  const stories = Array.from({ length: 20 }).map((_, i) => {
    const dbCreator = dbCreators && dbCreators.length > 0 ? dbCreators[i % dbCreators.length] : null;
    return {
      _id: dbCreator?.userId || `story-mock-${i}`,
      username: dbCreator?.username || `@${mockNames[i].toLowerCase()}`,
      displayName: dbCreator?.displayName || mockNames[i],
      avatarUrl: dbCreator?.avatarUrl || mockAvatars[i],
      isVerified: dbCreator?.isVerifiedBadge || true,
      isLive: i % 4 === 0,
      isOnline: i % 2 === 0,
      hasStory: true
    };
  });

  res.status(200).json({
    status: 'success',
    stories
  });
});

// Fetch Active Live Streams
// Fetch Active Live Streams
exports.getLiveStreams = catchAsync(async (req, res, next) => {
  const { category, language, sortBy, availability, tab } = req.query;

  // Query database creators
  const dbCreators = await CreatorProfile.find();

  // Define a complete set of 12 mock streams to make sure we show a filled grid
  const mockCovers = [
    '/Girl.png',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
  ];

  const mockCategories = ['Just Chatting', 'Music', 'Dance', 'ASMR', 'Gaming', 'Others'];
  const mockNames = [
    'Savannah', 'Leslie', 'Jenny', 'Kristin', 'Molly Jane', 
    'Aria', 'Chloe', 'Emma', 'Sophia', 'Olivia', 'Isabella', 'Ava'
  ];
  const mockUsernames = [
    'savannah', 'leslie', 'jenny', 'kristin', 'mollyjane',
    'aria_live', 'chloe_stream', 'emma_xo', 'sophia_chat', 'olivia_star', 'isabella_d', 'ava_game'
  ];

  let streams = [];
  for (let i = 0; i < 12; i++) {
    // Try to associate with a DB creator if available
    const dbCreator = dbCreators && dbCreators.length > 0 ? dbCreators[i % dbCreators.length] : null;
    
    // Distribute categories
    const streamCategory = dbCreator?.categories?.[0] || mockCategories[i % mockCategories.length];
    const isLiveStatus = i % 10 !== 9; // 90% are live, 10% are upcoming
    
    streams.push({
      _id: dbCreator?.userId || `mock-stream-${i}`,
      username: dbCreator?.username || mockUsernames[i],
      displayName: dbCreator?.displayName || mockNames[i],
      isVerified: dbCreator?.isVerifiedBadge || true,
      viewerCount: Math.floor(150 + (12 - i) * 65 + Math.random() * 40),
      streamTitle: dbCreator?.bio || "Let's talk...",
      coverUrl: mockCovers[i],
      category: streamCategory,
      rate: dbCreator?.rates?.videoCallPerMin || 18,
      language: dbCreator?.language || (i % 3 === 0 ? 'Spanish' : 'English'),
      isLive: isLiveStatus,
      isUpcoming: !isLiveStatus,
      rating: dbCreator?.rating || (4.5 + (i % 5) * 0.1)
    });
  }

  // Filter logic
  if (category && category !== 'All Categories') {
    streams = streams.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (language && language !== 'All Languages') {
    streams = streams.filter(s => s.language.toLowerCase() === language.toLowerCase());
  }

  if (availability === 'live') {
    streams = streams.filter(s => s.isLive);
  } else if (availability === 'upcoming') {
    streams = streams.filter(s => s.isUpcoming);
  }

  if (tab === 'trending') {
    streams.sort((a, b) => b.viewerCount - a.viewerCount);
  } else if (tab === 'liveNow') {
    streams = streams.filter(s => s.isLive);
  } else if (tab === 'topRated') {
    streams.sort((a, b) => b.rating - a.rating);
  } else if (tab === 'new') {
    streams = streams.slice().reverse();
  }

  // Sort By dropdown logic
  if (sortBy === 'Viewers High To Low') {
    streams.sort((a, b) => b.viewerCount - a.viewerCount);
  } else if (sortBy === 'Viewers Low To High') {
    streams.sort((a, b) => a.viewerCount - b.viewerCount);
  }

  // Leaderboard data
  const leaderboard = [
    { rank: 1, name: 'Alex King', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', spentCoins: '132,67' },
    { rank: 2, name: 'Jane Cooper', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', spentCoins: '132,67' },
    { rank: 3, name: 'Robert Fox', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80', spentCoins: '132,67' },
    { rank: 4, name: 'Jacob Jones', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', spentCoins: '132,67' }
  ];

  res.status(200).json({
    status: 'success',
    liveStreams: streams,
    leaderboard
  });
});

// Fetch Suggested Creators
exports.getSuggested = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const followingIds = user ? user.following : [];
  
  const creators = await CreatorProfile.find({
    userId: { $nin: [...followingIds, req.user._id] }
  }).limit(5);

  res.status(200).json({
    status: 'success',
    creators
  });
});

