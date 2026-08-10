const mongoose = require('mongoose');
const CreatorProfile = require('../models/CreatorProfile');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const SystemSetting = require('../models/SystemSetting');
const Story = require('../models/Story');
const Post = require('../models/Post');
const LiveStream = require('../models/LiveStream');
const LiveChatMessage = require('../models/LiveChatMessage');
const Message = require('../models/Message');
const CallLog = require('../models/CallLog');
const walletService = require('../services/wallet.service');
const agoraService = require('../services/agora.service');
const awsService = require('../services/aws.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const { getHiddenUserIds } = require('../utils/blockFilter');
const { getHiddenByVisibility } = require('./feed.controller');

// In-memory cache for profile view deduplication (10s cooldown per viewer/IP per profile)
const profileViewCooldowns = new Map();

// Compute date boundaries for a dashboard earnings period.
// Returns { start, prevStart, prevEnd } where `start` is inclusive and
// prevStart/prevEnd bound the previous equivalent window (for change %).
const getEarningsPeriodRange = (period) => {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const bounds = {
    today: { start: dayStart, daysBack: 1 },
    '7d': { start: new Date(dayStart.getTime() - 6 * 86400000), daysBack: 7 },
    '30d': { start: new Date(dayStart.getTime() - 29 * 86400000), daysBack: 30 },
    '90d': { start: new Date(dayStart.getTime() - 89 * 86400000), daysBack: 90 },
    all: null
  };

  // Only fall back to 'today' for periods that aren't defined at all.
  // 'all' is explicitly null so it must NOT fall through to bounds.today.
  const b = Object.prototype.hasOwnProperty.call(bounds, period) ? bounds[period] : bounds.today;
  if (!b) return { start: null, prevStart: null, prevEnd: null };

  const prevEnd = new Date(b.start);
  const prevStart = new Date(prevEnd.getTime() - b.daysBack * 86400000);
  return { start: b.start, prevStart, prevEnd };
};

// Real-time live stream room helpers (Socket.io)
const LIVE_STREAM_ROOM = (streamId) => `live_stream_${streamId}`;

// Broadcast the latest viewer count to everyone watching a live stream.
// Fans listening in the stream room update their cards live, and the stream
// owner (in their personal room) updates the "Live Now" banner in real time.
const broadcastLiveViewerCount = (io, streamId, creatorId, viewerCount, isLive = true) => {
  if (!io) return;
  const payload = {
    streamId: streamId.toString(),
    viewerCount,
    isLive
  };
  io.to(LIVE_STREAM_ROOM(streamId)).emit('live_viewer_update', payload);
  if (creatorId) {
    io.to(creatorId.toString()).emit('live_viewer_update', payload);
  }
};

// Notify fans on the browse pages that a stream went live or ended so they refresh.
const broadcastStreamLifecycle = (io, stream, isLive) => {
  if (!io) return;
  const payload = {
    streamId: stream._id.toString(),
    isLive
  };
  io.to('live_streams_global').emit(isLive ? 'stream_started' : 'stream_ended', payload);
  // Viewers already in the room need the end event; on start the room is empty.
  if (!isLive) {
    io.to(LIVE_STREAM_ROOM(stream._id)).emit('stream_ended', payload);
  }
  if (stream.creatorId) {
    io.to(stream.creatorId.toString()).emit('live_viewer_update', {
      streamId: stream._id.toString(),
      viewerCount: isLive ? (stream.viewerCount || 0) : 0,
      isLive
    });
  }
};

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
  const isObjId = mongoose.Types.ObjectId.isValid(username);

  const profile = await CreatorProfile.findOne(
    isObjId
      ? { $or: [{ username: username.toLowerCase() }, { userId: username }, { _id: username }] }
      : { username: username.toLowerCase() }
  ).populate('userId', 'email isVerified');

  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found.'));
  }

  // Enforce profile visibility. Private profiles are hidden from everyone but
  // the owner and admins. Subscribers Only profiles remain visible as a teaser
  // (their content is gated at the feed/media layer instead).
  const viewer = req.user;
  const isOwner = viewer && profile.userId && viewer._id.toString() === profile.userId._id.toString();
  if (profile.profileVisibility === 'Private' && !isOwner && viewer?.role !== 'admin') {
    return next(new ApiError(404, 'Creator profile not found.'));
  }

  // Track real profile views (analytics) — skip counting the owner viewing themselves
  // and deduplicate requests within a 10s cooldown window (prevents double-counting from React StrictMode or rapid double fetches)
  if (!viewer || (profile.userId && viewer._id.toString() !== profile.userId._id.toString())) {
    const viewerKey = viewer ? viewer._id.toString() : (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'guest');
    const dedupeKey = `${profile._id}_${viewerKey}`;
    const now = Date.now();
    const lastViewedAt = profileViewCooldowns.get(dedupeKey);

    if (!lastViewedAt || (now - lastViewedAt > 10000)) {
      profileViewCooldowns.set(dedupeKey, now);
      profile.profileViews = (profile.profileViews || 0) + 1;
      await profile.save({ validateBeforeSave: false });
    }
  }

  // Whether the requesting viewer holds an active subscription to this creator.
  // Drives the frontend teaser banner / subscribe CTA on the public profile.
  let isSubscribed = false;
  let subscribedPlan = null;
  if (viewer && profile.userId && !isOwner) {
    const activeSub = await Subscription.findOne({
      userId: viewer._id,
      creatorId: profile.userId._id,
      status: 'active',
      expiryDate: { $gt: new Date() }
    });
    if (activeSub) {
      isSubscribed = true;
      subscribedPlan = activeSub.plan || 'Premium';
    }
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
    isSubscribed,
    subscribedPlan,
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
exports.getProfileByUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new ApiError(400, 'Invalid user ID'));
  }

  const profile = await CreatorProfile.findOne({ userId }).populate('userId', 'email isVerified');
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  // Whether this creator is currently on an active call — drives the disabled
  // call buttons / "Busy" state in the chat UI for direct-navigation routes.
  const activeCall = await CallLog.findOne({
    status: 'active',
    $or: [{ callerId: userId }, { receiverId: userId }]
  });

  let isSubscribed = false;
  let subscribedPlan = null;
  const viewer = req.user;
  if (viewer && profile.userId && viewer._id.toString() !== profile.userId._id.toString()) {
    const activeSub = await Subscription.findOne({
      userId: viewer._id,
      creatorId: profile.userId._id,
      status: 'active',
      expiryDate: { $gt: new Date() }
    });
    if (activeSub) {
      isSubscribed = true;
      subscribedPlan = activeSub.plan || 'Premium';
    }
  }

  res.status(200).json({
    status: 'success',
    creator: profile,
    isSubscribed,
    subscribedPlan,
    isBusy: !!activeCall
  });
});

// Discover and search creators
exports.discoverCreators = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
  const skip = (page - 1) * limit;

  const filter = {};

  // Private profiles are not discoverable through public search
  filter.profileVisibility = { $ne: 'Private' };

  // Optional auth: hide blocked/blocking creators and the user's own profile
  const hiddenIds = req.user ? await getHiddenUserIds(req.user._id) : [];
  const excludedUserIds = [...hiddenIds];
  if (req.user) {
    excludedUserIds.push(req.user._id);
  }
  if (excludedUserIds.length > 0) {
    filter.userId = { $nin: excludedUserIds };
  }

  // Apply search query
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { username: searchRegex },
      { displayName: searchRegex }
    ];
  }

  // Apply category filtering
  if (req.query.category && req.query.category !== 'All Categories') {
    filter.categories = req.query.category;
  }

  // Availability & relationship filters (creators who hide their online status are excluded
  // from online-only results so the preference is honored end-to-end)
  if (req.query.isOnline === 'true') {
    filter.isOnline = true;
    filter.showOnlineStatus = { $ne: false };
  }
  if (req.query.isFollowing === 'true') {
    if (req.user) {
      const me = await User.findById(req.user._id, 'following');
      const followingIds = me && me.following ? me.following : [];
      if (filter.userId && filter.userId.$nin) {
        const allowed = followingIds.filter((id) => !filter.userId.$nin.map((x) => x.toString()).includes(id.toString()));
        filter.userId = { $in: allowed };
      } else {
        filter.userId = { $in: followingIds };
      }
    } else {
      filter.userId = { $in: [] };
    }
  }
  if (req.query.isSubscribed === 'true') {
    if (req.user) {
      const subs = await Subscription.find({
        userId: req.user._id,
        status: 'active',
        expiryDate: { $gt: new Date() }
      }).select('creatorId');
      const subCreatorIds = subs.map((s) => s.creatorId);
      if (filter.userId && filter.userId.$nin) {
        const allowed = subCreatorIds.filter((id) => !filter.userId.$nin.map((x) => x.toString()).includes(id.toString()));
        filter.userId = { $in: allowed };
      } else {
        filter.userId = { $in: subCreatorIds };
      }
    } else {
      filter.userId = { $in: [] };
    }
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

  const [creators, total] = await Promise.all([
    CreatorProfile.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email isVerified'),
    CreatorProfile.countDocuments(filter)
  ]);

  // Annotate with follow & subscription state for the current user
  let followingSet = null;
  let subscribedSet = null;
  if (req.user) {
    const [me, subs] = await Promise.all([
      User.findById(req.user._id, 'following'),
      Subscription.find({
        userId: req.user._id,
        status: 'active',
        expiryDate: { $gt: new Date() }
      }).select('creatorId')
    ]);
    if (me && me.following) {
      followingSet = new Set(me.following.map((id) => id.toString()));
    }
    if (subs) {
      subscribedSet = new Set(subs.map((s) => s.creatorId.toString()));
    }
  }

  const data = creators.map((c) => {
    const doc = c.toObject();
    const userIdStr = doc.userId && (doc.userId._id || doc.userId).toString();
    doc.isFollowing = followingSet ? followingSet.has(userIdStr) : false;
    doc.isSubscribed = subscribedSet ? subscribedSet.has(userIdStr) : false;
    return doc;
  });

  res.status(200).json({
    status: 'success',
    creators: data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Get trending creators
exports.getTrending = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit || '5', 10);

  const hiddenIds = req.user ? await getHiddenUserIds(req.user._id) : [];
  const query = {
    // Private profiles are not discoverable through public rankings
    profileVisibility: { $ne: 'Private' }
  };
  if (hiddenIds.length > 0) {
    query.userId = { $nin: hiddenIds };
  }

  // Sort by subscriberCount and followerCount descending
  const creators = await CreatorProfile.find(query)
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

  if (!mongoose.Types.ObjectId.isValid(creatorId)) {
    return next(new ApiError(400, 'Invalid creator id.'));
  }

  if (creatorId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot follow yourself.'));
  }

  // Find creator profile
  const profile = await CreatorProfile.findOne({ userId: creatorId });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found.'));
  }

  // Prevent following someone you blocked or who blocked you
  if (req.user.blockedUsers.includes(creatorId)) {
    return next(new ApiError(400, 'You cannot follow a user you have blocked. Unblock them first.'));
  }
  const blockedByCreator = await User.exists({ _id: creatorId, blockedUsers: req.user._id });
  if (blockedByCreator) {
    return next(new ApiError(400, 'You cannot follow this creator.'));
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
    following: !isFollowing,
    followerCount: profile.followerCount,
    creator: profile
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
// Powers the Dashboard page: quick actions, live/schedule form, recent content,
// earnings overview, upcoming streams and quick stats — all from real data.
exports.getCreatorDashboard = catchAsync(async (req, res, next) => {
  const { period } = req.query;
  const periodKey = ['today', '7d', '30d', '90d', 'all'].includes(period) ? period : 'all';

  const profile = await CreatorProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  // Retrieve all completed payouts / earnings
  const COMMISSION_TYPES = ['subscription', 'tip', 'gift', 'ppv_unlock', 'call_billing', 'live_entry', 'store_purchase'];
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
  let liveEarnings = 0;
  let storeEarnings = 0;

  for (const tx of transactions) {
    let creatorShare = tx.amountCoins;
    // Apply system fee deduction
    if (COMMISSION_TYPES.includes(tx.type)) {
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
    } else if (tx.type === 'live_entry') {
      liveEarnings += creatorShare;
    } else if (tx.type === 'store_purchase') {
      storeEarnings += creatorShare;
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

  // ----- Dashboard page extras (real data) -----

  // Unread incoming message count (messages sent TO this creator, not opened yet)
  const unreadMessages = await Message.countDocuments({
    receiverId: req.user._id,
    isOpened: false
  });

  // Quick actions: audio/video availability + rates, messages, stream
  const quickActions = [
    {
      id: 'audio',
      title: 'Audio Calls',
      isOnline: profile.audioAvailable !== false,
      rate: `${profile.rates.audioCallPerMin || 0}`,
      rateUnit: 'coins/min',
      color: '#10b981',
      goLiveBtnLabel: 'Toggle Availability',
      editRateLabel: 'Edit Rate'
    },
    {
      id: 'video',
      title: 'Video Calls',
      isOnline: profile.videoAvailable !== false,
      rate: `${profile.rates.videoCallPerMin || 0}`,
      rateUnit: 'coins/min',
      color: '#3b82f6',
      goLiveBtnLabel: 'Toggle Availability',
      editRateLabel: 'Edit Rate'
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Reply to Messages',
      isOnline: true,
      unreadCount: unreadMessages,
      color: '#8b5cf6',
      actionLabel: 'Open Messages'
    },
    {
      id: 'stream',
      title: 'Go Live',
      isOnline: !!profile.isLive,
      color: '#e10075',
      goLiveBtnLabel: profile.isLive ? 'Streaming Now' : 'Start Stream',
      editRateLabel: 'Schedule'
    }
  ];

  // Recent content (posts + stories)
  const [recentPosts, recentStories] = await Promise.all([
    Post.find({ creatorId: req.user._id }).sort({ createdAt: -1 }).limit(8),
    Story.find({ creatorId: req.user._id }).sort({ createdAt: -1 }).limit(4)
  ]);

  const recentContent = [
    ...recentPosts.map((p) => ({
      id: p._id,
      title: p.content ? (p.content.length > 30 ? `${p.content.slice(0, 30)}...` : p.content) : 'New post',
      type: p.postType === 'ppv' ? 'Locked' : 'Open',
      status: p.postType === 'ppv' ? 'Locked' : 'Open',
      timeAgo: p.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      views: p.likes ? p.likes.length : 0,
      likes: p.likes ? p.likes.length : 0,
      comments: p.commentCount || 0,
      thumbnail: p.media && p.media[0] ? p.media[0].thumbnailUrl || p.media[0].url : '',
      price: p.coinPrice ? `${p.coinPrice} coins` : '',
      isStory: false
    })),
    ...recentStories.map((s) => ({
      id: s._id,
      title: 'Story',
      type: 'Story',
      status: 'Open',
      timeAgo: s.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      views: s.views ? s.views.length : 0,
      likes: 0,
      comments: 0,
      thumbnail: s.mediaUrl || '',
      price: '',
      isStory: true
    }))
  ].slice(0, 8);

  // Earnings overview (selected period vs previous equivalent period)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const thisMonthNet = transactions
    .filter((t) => t.createdAt >= monthStart && COMMISSION_TYPES.includes(t.type))
    .reduce((s, t) => s + t.amountCoins * (1 - commRate), 0);
  const lastMonthNet = transactions
    .filter((t) => t.createdAt >= lastMonthStart && t.createdAt < monthStart && COMMISSION_TYPES.includes(t.type))
    .reduce((s, t) => s + t.amountCoins * (1 - commRate), 0);
  const earningsChange = lastMonthNet > 0 ? Math.round(((thisMonthNet - lastMonthNet) / lastMonthNet) * 100) : (thisMonthNet > 0 ? 100 : 0);

  const { start: periodStart, prevStart, prevEnd } = getEarningsPeriodRange(periodKey);
  const periodNet = periodStart
    ? transactions
        .filter((t) => t.createdAt >= periodStart && COMMISSION_TYPES.includes(t.type))
        .reduce((s, t) => s + t.amountCoins * (1 - commRate), 0)
    : transactions
        .filter((t) => COMMISSION_TYPES.includes(t.type))
        .reduce((s, t) => s + t.amountCoins * (1 - commRate), 0);
  const prevNet = prevStart
    ? transactions
        .filter((t) => t.createdAt >= prevStart && t.createdAt < prevEnd && COMMISSION_TYPES.includes(t.type))
        .reduce((s, t) => s + t.amountCoins * (1 - commRate), 0)
    : null;
  const periodChange = prevNet && prevNet > 0
    ? Math.round(((periodNet - prevNet) / prevNet) * 100)
    : (periodNet > 0 ? 100 : 0);
  const PERIOD_LABELS = {
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    all: 'All Time'
  };
  const periodLabel = PERIOD_LABELS[periodKey] || 'Today';

  // Upcoming (scheduled) streams
  const upcomingStreams = await LiveStream.find({
    creatorId: req.user._id,
    isLive: false,
    cancelledAt: null,
    scheduledAt: { $gt: new Date() }
  }).sort({ scheduledAt: 1 }).limit(4);

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
          calls: Number(callEarnings.toFixed(2)),
          live: Number(liveEarnings.toFixed(2)),
          store: Number(storeEarnings.toFixed(2))
        }
      },
      fans: populatedFans
    },
    dashboard: {
      quickActions,
      streamOptions: {
        defaultTitle: 'e.g. Friday Night Show',
        defaultPrice: '5',
        freeForSubscribersLabel: 'Free for subscribers',
        freeForSubscribersDesc: 'Subscribers can join this stream without paying the entry fee.',
        startGoLiveLabel: 'Go Live Now',
        startGoLiveDesc: 'Start streaming immediately',
        scheduleForLaterLabel: 'Schedule for Later',
        scheduleForLaterDesc: 'Pick a date and time'},
      recentContent,
      earningsOverview: {
        period: periodLabel,
        totalCoins: Number(periodNet.toFixed(2)),
        change: prevNet === null ? 'All time' : `${periodChange >= 0 ? '+' : ''}${periodChange}%`,
        byCategory: {
          subscriptions: Number(subscriptionEarnings.toFixed(2)),
          tips: Number(tipEarnings.toFixed(2)),
          ppv: Number(ppvEarnings.toFixed(2)),
          calls: Number(callEarnings.toFixed(2)),
          live: Number(liveEarnings.toFixed(2)),
          store: Number(storeEarnings.toFixed(2))
        }
      },
      upcomingStreams: upcomingStreams.map((s) => ({
        id: s._id,
        title: s.streamTitle,
        date: s.scheduledAt,
        category: s.category,
        entryPrice: s.entryPriceCoins || 0,
        freeForSubscribers: !!s.freeForSubscribers
      })),
      quickStats: {
        period: periodLabel,
        stats: [
          { label: 'Earnings (coins)', value: `${Number(periodNet.toFixed(2))}`, icon: 'earnings', color: '#e10075', change: prevNet === null ? '' : `${periodChange >= 0 ? '+' : ''}${periodChange}%` },
          { label: 'Subscribers', value: String(profile.subscriberCount || 0), icon: 'subscribers', color: '#8b5cf6', change: prevNet === null ? '' : 'All time' },
          { label: 'Followers', value: String(profile.followerCount || 0), icon: 'followers', color: '#3b82f6', change: prevNet === null ? '' : 'All time' },
          { label: 'Purchases', value: `${transactions.filter((t) => !periodStart || t.createdAt >= periodStart).length}`, icon: 'engagement', color: '#10b981', change: prevNet === null ? '' : 'All time' }
        ]
      }
    }
  });
});

// Fetch Active Stories
exports.getStories = catchAsync(async (req, res, next) => {
  const hiddenIds = req.user ? await getHiddenUserIds(req.user._id) : [];

  // Find active stories (not expired), excluding blocked users' stories
  const storyQuery = { expiresAt: { $gt: new Date() } };
  if (hiddenIds.length > 0) {
    storyQuery.creatorId = { $nin: hiddenIds };
  }

  const activeStories = await Story.find(storyQuery).sort({ createdAt: -1 });

  // Group stories by creatorId
  const storiesByCreator = {};
  for (const story of activeStories) {
    const cid = story.creatorId.toString();
    if (!storiesByCreator[cid]) {
      storiesByCreator[cid] = [];
    }
    storiesByCreator[cid].push(story);
  }

  const creatorIds = Object.keys(storiesByCreator);

  // Hide stories from Private and non-subscribed Subscribers Only creators
  const visibilityHidden = new Set(await getHiddenByVisibility(req.user));
  const visibleCreatorIds = creatorIds.filter((id) => !visibilityHidden.has(id));
  const profiles = visibleCreatorIds.length > 0
    ? await CreatorProfile.find({ userId: { $in: visibleCreatorIds } })
    : [];

  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.userId.toString()] = p;
  });

  // Determine which visible creators are currently on an active call, so the
  // "online" dot on story cards reflects real-time availability (calls / live).
  const activeCalls = visibleCreatorIds.length > 0
    ? await CallLog.find({
        status: 'active',
        $or: [
          { callerId: { $in: visibleCreatorIds } },
          { receiverId: { $in: visibleCreatorIds } }
        ]
      }).select('callerId receiverId').lean()
    : [];
  const onCallIds = new Set();
  activeCalls.forEach((c) => {
    onCallIds.add(c.callerId.toString());
    onCallIds.add(c.receiverId.toString());
  });

  const dbStories = visibleCreatorIds.map((creatorId) => {
    const profile = profileMap[creatorId];
    const items = storiesByCreator[creatorId] || [];
    return {
      _id: creatorId,
      username: profile ? profile.username : '',
      displayName: profile ? (profile.displayName || profile.username) : 'Creator',
      avatarUrl: profile ? (profile.avatarUrl || '') : '',
      isVerified: profile ? (profile.isVerifiedBadge || false) : false,
      isLive: profile ? (profile.isLive || false) : false,
      isOnline: profile
        ? (profile.showOnlineStatus !== false && (profile.isLive || onCallIds.has(creatorId)))
        : false,
      hasStory: true,
      items: items.map((item) => ({
        _id: item._id,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        viewsCount: item.views.length,
        viewed: req.user ? item.views.includes(req.user._id) : false,
        createdAt: item.createdAt
      }))
    };
  });

  res.status(200).json({
    status: 'success',
    stories: dbStories
  });
});

// Mark a story as viewed by the current user
exports.markStoryViewed = catchAsync(async (req, res, next) => {
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    return next(new ApiError(404, 'Story not found'));
  }

  if (!story.views.includes(req.user._id)) {
    story.views.push(req.user._id);
    await story.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: 'success',
    viewsCount: story.views.length
  });
});

// Fetch Active Live Streams (public fan-facing listing)
exports.getLiveStreams = catchAsync(async (req, res, next) => {
  const { category, language, sortBy, availability, tab, search } = req.query;

  const hiddenIds = req.user ? await getHiddenUserIds(req.user._id) : [];

  // Only live streams and future scheduled streams are shown to fans.
  // Ended/cancelled streams are never listed here.
  const streamQuery = {
    cancelledAt: null,
    $or: [{ isLive: true }, { scheduledAt: { $gt: new Date() } }]
  };
  if (hiddenIds.length > 0) {
    streamQuery.creatorId = { $nin: hiddenIds };
  }

  const dbStreams = await LiveStream.find(streamQuery)
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ startedAt: -1 });

  // Single query for all creator profiles (avoids N+1 lookups)
  const creatorIds = [...new Set(dbStreams.map((s) => s.creatorId?._id?.toString()).filter(Boolean))];
  const profiles = creatorIds.length
    ? await CreatorProfile.find({ userId: { $in: creatorIds } })
    : [];
  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.userId.toString()] = p;
  });

  // Hide streams from Private and non-subscribed Subscribers Only creators
  const visibilityHidden = new Set(await getHiddenByVisibility(req.user));
  const visibleStreams = dbStreams.filter(
    (s) => !visibilityHidden.has(s.creatorId?._id?.toString())
  );

  const mappedDbStreams = visibleStreams.map((stream) => {
    const creator = stream.creatorId || {};
    const profile = profileMap[creator._id?.toString()] || {};
    const isLive = !!stream.isLive;
    return {
      _id: stream._id,
      creatorId: creator._id,
      username: profile.username || creator.username || '',
      displayName: profile.displayName || creator.displayName || profile.username || 'Creator',
      isVerified: profile.isVerifiedBadge || false,
      viewerCount: stream.viewerCount || 0,
      streamTitle: stream.streamTitle,
      coverUrl: stream.coverUrl || profile.coverBannerUrl || '/Girl.png',
      category: stream.category,
      rate: (profile.rates && profile.rates.videoCallPerMin) || 18,
      language: stream.language,
      isLive,
      isUpcoming: !isLive,
      status: isLive ? 'live' : 'scheduled',
      entryPriceCoins: stream.entryPriceCoins || 0,
      freeForSubscribers: !!stream.freeForSubscribers,
      scheduledAt: stream.scheduledAt,
      rating: profile.rating || 4.9,
      startedAt: stream.startedAt,
      endedAt: stream.endedAt,
      roomId: stream.roomId
    };
  });

  let streams = mappedDbStreams;

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    streams = streams.filter(s =>
      (s.streamTitle && s.streamTitle.toLowerCase().includes(q)) ||
      (s.displayName && s.displayName.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q))
    );
  }

  // Filter logic (mirrors the fan page controls)
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

  if (tab === 'liveNow') {
    streams = streams.filter(s => s.isLive);
  } else if (tab === 'upcoming') {
    streams = streams.filter(s => s.isUpcoming);
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

  // Leaderboard: aggregate earnings per creator across monetized interactions
  const dynamicLeaderboard = await Transaction.aggregate([
    {
      $match: {
        status: 'completed',
        type: { $in: ['subscription', 'tip', 'gift', 'ppv_unlock', 'call_billing', 'live_entry'] }
      }
    },
    {
      $group: {
        _id: '$receiverId',
        totalEarned: { $sum: '$amountCoins' }
      }
    },
    {
      $sort: { totalEarned: -1 }
    },
    {
      $limit: 5
    }
  ]);

  const leaderProfiles = dynamicLeaderboard.length
    ? await CreatorProfile.find({ userId: { $in: dynamicLeaderboard.map((d) => d._id).filter(Boolean) } })
    : [];
  const leaderProfileMap = {};
  leaderProfiles.forEach((p) => {
    leaderProfileMap[p.userId.toString()] = p;
  });

  const populatedLeaderboard = dynamicLeaderboard
    .filter((item) => item._id && leaderProfileMap[item._id.toString()])
    .map((item) => {
      const profile = leaderProfileMap[item._id.toString()];
      return {
        name: profile.displayName || profile.username,
        avatarUrl: profile.avatarUrl || '',
        coinsEarned: item.totalEarned.toLocaleString()
      };
    });

  // Live count per category (powers the "Live Categories" shelf on the fan page)
  const categoryCounts = {};
  mappedDbStreams.filter((s) => s.isLive).forEach((s) => {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
  });
  const categories = Object.entries(categoryCounts).map(([name, liveCount]) => ({ name, liveCount }));

  res.status(200).json({
    status: 'success',
    liveStreams: streams,
    leaderboard: populatedLeaderboard,
    categories,
    total: streams.length
  });
});

// Fetch Suggested Creators
exports.getSuggested = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const followingIds = user ? user.following : [];
  const hiddenIds = await getHiddenUserIds(req.user._id);

  const creators = await CreatorProfile.find({
    userId: { $nin: [...followingIds, req.user._id, ...hiddenIds] },
    // Private profiles are not recommended to other users
    profileVisibility: { $ne: 'Private' }
  }).limit(5);

  res.status(200).json({
    status: 'success',
    creators
  });
});

// Creator uploads a story
exports.createStory = catchAsync(async (req, res, next) => {
  const { mediaUrl, mediaType, durationHours } = req.body;

  if (!mediaUrl || !mediaType) {
    return next(new ApiError(400, 'Please provide mediaUrl and mediaType'));
  }

  const hours = durationHours ? parseInt(durationHours, 10) : 24;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const story = await Story.create({
    creatorId: req.user._id,
    mediaUrl,
    mediaType,
    expiresAt
  });

  res.status(201).json({
    status: 'success',
    story
  });
});

// Creator deletes a story
exports.deleteStory = catchAsync(async (req, res, next) => {
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    return next(new ApiError(404, 'Story not found'));
  }

  // Authorize: creator can only delete their own story
  if (story.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'You do not have permission to delete this story'));
  }

  await awsService.deleteS3Media([story.mediaUrl]);
  await Story.findByIdAndDelete(storyId);

  res.status(200).json({
    status: 'success',
    message: 'Story successfully deleted'
  });
});

// Creator schedules a future live stream
exports.scheduleLiveStream = catchAsync(async (req, res, next) => {
  const { streamTitle, category, scheduledAt, coverUrl, language, entryPriceCoins, freeForSubscribers } = req.body;    if (!streamTitle || !streamTitle.trim()) {
      return next(new ApiError(400, 'Please provide streamTitle and category'));
    }
    if (!category) {
      return next(new ApiError(400, 'Please provide streamTitle and category'));
    }
    if (!scheduledAt) {
      return next(new ApiError(400, 'Please provide a scheduledAt date'));
    }

  const startDate = new Date(scheduledAt);
  if (Number.isNaN(startDate.getTime()) || startDate.getTime() <= Date.now()) {
    return next(new ApiError(400, 'Scheduled time must be in the future'));
  }

  if (Number(entryPriceCoins || 0) < 1) {
    return next(new ApiError(400, 'Entry price must be at least 1 coin'));
  }

  const roomId = `live_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  const stream = await LiveStream.create({
    creatorId: req.user._id,
    streamTitle: streamTitle.trim(),
    category,
    coverUrl: coverUrl || '',
    language: language || 'English',
    isLive: false,
    scheduledAt: startDate,
    entryPriceCoins: Number(entryPriceCoins),
    freeForSubscribers: !!freeForSubscribers,
    roomId: roomId
  });

  res.status(201).json({
    status: 'success',
    stream
  });
});

// Creator's live stream hub: stats, upcoming, recent + sidebar widgets
exports.getMyLiveStreams = catchAsync(async (req, res, next) => {
  const profile = await CreatorProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  const { period = 'All Time' } = req.query;
  const { getPeriodStart } = require('../utils/periodRange');
  const periodStart = getPeriodStart(period);

  const streamQuery = { creatorId: req.user._id };
  if (periodStart) streamQuery.createdAt = { $gte: periodStart };
  const allStreams = await LiveStream.find(streamQuery).sort({ createdAt: -1 });

  // Earnings per stream from paid entries (for recent + top lists).
  // Reported net of platform commission, consistent with the creator dashboard.
  const systemSetting = await SystemSetting.findOne();
  const commRate = systemSetting ? systemSetting.commissionRate : 0.20;
  const netShare = (gross) => Number((gross * (1 - commRate)).toFixed(2));

  const entryTxs = await Transaction.find({
    receiverId: req.user._id,
    type: 'live_entry',
    status: 'completed',
    referenceId: { $ne: null }
  });
  const earningsByStream = {};
  entryTxs.forEach((tx) => {
    const key = tx.referenceId ? tx.referenceId.toString() : '';
    if (key) earningsByStream[key] = (earningsByStream[key] || 0) + netShare(tx.amountCoins || 0);
  });

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
  };

  const fallbackThumb = profile.coverBannerUrl || profile.avatarUrl || '/Girl.png';
  const now = new Date();

  // Upcoming (scheduled, future, not cancelled)
  const upcoming = allStreams
    .filter((s) => !s.isLive && !s.cancelledAt && s.scheduledAt && new Date(s.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .map((s) => ({
      _id: s._id,
      title: s.streamTitle,
      thumbnail: s.coverUrl || fallbackThumb,
      date: s.scheduledAt,
      category: s.category,
      entryPrice: s.entryPriceCoins || 0,
      freeForSubscribers: !!s.freeForSubscribers,
      status: 'Scheduled'
    }));

  // Recent (ended streams, newest first)
  const recent = allStreams
    .filter((s) => s.endedAt && !s.isLive)
    .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
    .slice(0, 12)
    .map((s) => {
      const durationSeconds = s.startedAt
        ? Math.max(0, Math.floor((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000))
        : 0;
      return {
        _id: s._id,
        title: s.streamTitle,
        thumbnail: s.coverUrl || fallbackThumb,
        category: s.category,
        date: s.endedAt,
        duration: formatDuration(durationSeconds),
        views: s.totalViews || 0,
        earnings: earningsByStream[s._id.toString()] || 0
      };
    });

  const liveNow = allStreams.find((s) => s.isLive) || null;

  // Overview stats
  const totalStreams = allStreams.length;
  const totalViews = allStreams.reduce((sum, s) => sum + (s.totalViews || 0), 0);
  const totalEarnings = Object.values(earningsByStream).reduce((a, b) => a + b, 0);
  const endedStreams = allStreams.filter((s) => s.endedAt);
  const totalDurationSeconds = endedStreams.reduce((sum, s) => {
    if (!s.startedAt || !s.endedAt) return sum;
    return sum + Math.max(0, Math.floor((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000));
  }, 0);
  const avgDurationSeconds = endedStreams.length ? Math.floor(totalDurationSeconds / endedStreams.length) : 0;

  // Category breakdown (count + percentage across all streams)
  const categoryCounts = {};
  allStreams.forEach((s) => {
    const key = s.category || 'Other';
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });
  const catTotal = Math.max(1, allStreams.length);
  const categories = Object.entries(categoryCounts).map(([label, count]) => ({
    label,
    count,
    percentage: Math.round((count / catTotal) * 100)
  }));

  // Top streams by earnings
  const topStreams = recent
    .filter((s) => s.earnings > 0)
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  res.status(200).json({
    status: 'success',
    liveNow,
    upcoming,
    recent,
    stats: {
      totalStreams,
      totalViews,
      totalEarnings: Number(totalEarnings.toFixed(2)),
      avgDurationSeconds
    },
    categories,
    topStreams,
    quickStats: {
      totalViews,
      totalWatchTimeSeconds: totalDurationSeconds,
      followers: profile.followerCount || 0
    }
  });
});

// Creator edits a scheduled stream
exports.updateLiveStream = catchAsync(async (req, res, next) => {
  const { streamId } = req.params;
  const { streamTitle, category, scheduledAt, coverUrl, language, entryPriceCoins, freeForSubscribers } = req.body;

  const stream = await LiveStream.findOne({ _id: streamId, creatorId: req.user._id });
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }
  if (stream.isLive) {
    return next(new ApiError(400, 'Live streams cannot be edited while active'));
  }
  if (stream.cancelledAt) {
    return next(new ApiError(400, 'This stream was cancelled and can no longer be edited'));
  }    if (streamTitle !== undefined) {
      if (!streamTitle.trim()) {
        return next(new ApiError(400, 'Stream title cannot be empty'));
      }
      stream.streamTitle = streamTitle;
    }
    if (category !== undefined) stream.category = category;
    if (coverUrl !== undefined) stream.coverUrl = coverUrl;
    if (language !== undefined) stream.language = language;
    if (entryPriceCoins !== undefined) {
      if (Number(entryPriceCoins || 0) < 1) {
        return next(new ApiError(400, 'Entry price must be at least 1 coin'));
      }
      stream.entryPriceCoins = Number(entryPriceCoins);
    }
    if (freeForSubscribers !== undefined) stream.freeForSubscribers = !!freeForSubscribers;

  if (scheduledAt !== undefined) {
    const startDate = new Date(scheduledAt);
    if (Number.isNaN(startDate.getTime()) || startDate.getTime() <= Date.now()) {
      return next(new ApiError(400, 'Scheduled time must be in the future'));
    }
    stream.scheduledAt = startDate;
  }

  await stream.save();

  res.status(200).json({
    status: 'success',
    stream
  });
});

// Recent chat history for a live stream (chronological, newest capped)
exports.getStreamChat = catchAsync(async (req, res, next) => {
  const { streamId } = req.params;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const stream = await LiveStream.findById(streamId);
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }

  const history = await LiveChatMessage.find({ streamId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Resolve sender display info in one batch
  const userIds = [...new Set(history.map((m) => String(m.userId)))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select('displayName username avatarUrl').lean()
    : [];
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  // Reverse back to chronological for the UI
  const messages = history.reverse().map((m) => {
    const sender = userMap.get(String(m.userId));
    return {
      _id: m._id,
      streamId: m.streamId,
      userId: m.userId,
      displayName: (sender && (sender.displayName || sender.username)) || 'Fan',
      avatarUrl: (sender && sender.avatarUrl) || '',
      text: m.text,
      createdAt: m.createdAt
    };
  });

  res.status(200).json({
    status: 'success',
    messages
  });
});

// Post a chat message into a live stream room and broadcast it to everyone
// watching (all viewers + the host). Messages persist so late joiners get the
// recent history. The sender receives the same payload twice (API response +
// socket echo) — the frontend dedups by message _id.
exports.sendStreamChat = catchAsync(async (req, res, next) => {
  const { streamId } = req.params;
  const clean = String((req.body && req.body.text) || '').trim().slice(0, 500);
  if (!clean) {
    return next(new ApiError(400, 'Message cannot be empty'));
  }

  const stream = await LiveStream.findById(streamId);
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }
  if (!stream.isLive) {
    return next(new ApiError(400, 'Chat is only available while the stream is live'));
  }

  const message = await LiveChatMessage.create({
    streamId,
    userId: req.user._id,
    text: clean
  });

  const payload = {
    _id: message._id,
    streamId: message.streamId,
    userId: req.user._id,
    displayName: req.user.displayName || req.user.username || 'Fan',
    avatarUrl: req.user.avatarUrl || '',
    text: clean,
    createdAt: message.createdAt
  };

  const io = req.app.get('io');
  if (io) {
    io.to(`live_stream_${streamId}`).emit('stream_chat', payload);
    // Also target the sender's own user room so their UI updates even if the
    // stream-room join lagged or failed.
    io.to(String(req.user._id)).emit('stream_chat', payload);
  }

  res.status(201).json({
    status: 'success',
    message: payload
  });
});

// Cumulative gift totals per viewer for a stream, computed from the gift
// transaction ledger (referenceId = streamId). Lets a viewer who joins mid-
// stream see the full leaderboard, not just gifts sent while they were
// watching. Live gift events are layered on top client-side.
exports.getStreamLeaderboard = catchAsync(async (req, res, next) => {
  const { streamId } = req.params;
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const stream = await LiveStream.findById(streamId);
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }

  const gifts = await Transaction.find({
    type: 'gift',
    status: 'completed',
    referenceId: streamId
  })
    .select('senderId amountCoins')
    .lean();

  const totals = new Map();
  gifts.forEach((g) => {
    if (!g.senderId) return;
    const key = String(g.senderId);
    const cur = totals.get(key) || { totalCoins: 0, count: 0 };
    cur.totalCoins += Number(g.amountCoins) || 0;
    cur.count += 1;
    totals.set(key, cur);
  });

  const senderIds = [...totals.keys()];
  const users = senderIds.length
    ? await User.find({ _id: { $in: senderIds } }).select('displayName username avatarUrl').lean()
    : [];
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const leaderboard = [...totals.entries()]
    .map(([userId, t]) => {
      const u = userMap.get(userId);
      return {
        userId,
        displayName: (u && (u.displayName || u.username)) || 'Fan',
        avatarUrl: (u && u.avatarUrl) || '',
        totalCoins: t.totalCoins,
        count: t.count
      };
    })
    .sort((a, b) => b.totalCoins - a.totalCoins)
    .slice(0, limit);

  res.status(200).json({
    status: 'success',
    leaderboard
  });
});

// Creator cancels a scheduled stream (or deletes an ended one)
exports.deleteLiveStream = catchAsync(async (req, res, next) => {
  const { streamId } = req.params;

  const stream = await LiveStream.findOne({ _id: streamId, creatorId: req.user._id });
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }
  if (stream.isLive) {
    return next(new ApiError(400, 'End the live stream before deleting it'));
  }

  if (stream.scheduledAt && !stream.cancelledAt) {
    stream.cancelledAt = Date.now();
    await stream.save();
    return res.status(200).json({
      status: 'success',
      message: 'Scheduled stream cancelled successfully',
      cancelled: true
    });
  }

  // Remove the uploaded cover thumbnail from S3 (seeded/external covers are skipped).
  await awsService.deleteS3Media([stream.coverUrl]);
  await LiveStream.findByIdAndDelete(streamId);
  // Clean up the stream's chat history with it.
  await LiveChatMessage.deleteMany({ streamId });
  res.status(200).json({
    status: 'success',
    message: 'Stream deleted successfully',
    deleted: true
  });
});

// Creator starts a live stream (optionally from a scheduled stream)
exports.startLiveStream = catchAsync(async (req, res, next) => {
  const { streamId, streamTitle, category, coverUrl, language, entryPriceCoins, freeForSubscribers } = req.body;

  if (entryPriceCoins !== undefined && Number(entryPriceCoins || 0) < 1) {
    return next(new ApiError(400, 'Entry price must be at least 1 coin'));
  }

  let scheduledStream = null;
  if (streamId) {
    scheduledStream = await LiveStream.findById(streamId);
    if (!scheduledStream || scheduledStream.creatorId.toString() !== req.user._id.toString()) {
      return next(new ApiError(404, 'Scheduled stream not found'));
    }
    if (scheduledStream.isLive || scheduledStream.cancelledAt) {
      return next(new ApiError(400, 'This stream cannot be started'));
    }
  } else if (!streamTitle || !category) {
    return next(new ApiError(400, 'Please provide streamTitle and category'));
  }

  // End any existing active live stream for this creator.
  // Note: updateMany bypasses the pre-save hook, so `status` must be set here too.
  await LiveStream.updateMany(
    { creatorId: req.user._id, isLive: true, _id: { $ne: scheduledStream ? scheduledStream._id : null } },
    { $set: { isLive: false, status: 'ended', endedAt: Date.now() } }
  );

  const roomId = `live_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  let newStream;

  if (scheduledStream) {
    scheduledStream.streamTitle = streamTitle || scheduledStream.streamTitle;
    scheduledStream.category = category || scheduledStream.category;
    if (coverUrl !== undefined) scheduledStream.coverUrl = coverUrl;
    if (language !== undefined) scheduledStream.language = language;
    if (entryPriceCoins !== undefined) scheduledStream.entryPriceCoins = Number(entryPriceCoins);
    if (freeForSubscribers !== undefined) scheduledStream.freeForSubscribers = !!freeForSubscribers;
    scheduledStream.roomId = roomId;
    scheduledStream.isLive = true;
    scheduledStream.startedAt = Date.now();
    scheduledStream.endedAt = null;
    scheduledStream.cancelledAt = null;
    await scheduledStream.save();
    newStream = scheduledStream;
  } else {
    newStream = await LiveStream.create({
      creatorId: req.user._id,
      streamTitle,
      category,
      coverUrl: coverUrl || '',
      language: language || 'English',
      isLive: true,
      entryPriceCoins: Number(entryPriceCoins),
      freeForSubscribers: !!freeForSubscribers,
    roomId: roomId
    });
  }

  // Generate token for creator to stream (privilege 2 = publisher)
  const agoraToken = agoraService.generateAgoraToken(req.user._id, roomId, 2);

  // Update profile status
  await CreatorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { isLive: true } }
  );

  // Notify browse pages + creator that a new stream is live
  const io = req.app.get('io');
  broadcastStreamLifecycle(io, newStream, true);

  res.status(201).json({
    status: 'success',
    roomId,
    agoraToken,
    stream: newStream
  });
});

// Creator ends a live stream
exports.endLiveStream = catchAsync(async (req, res, next) => {
  const { streamId, roomId } = req.body;

  const query = { creatorId: req.user._id, isLive: true };
  if (streamId) query._id = streamId;
  else if (roomId) query.roomId = roomId;
  else return next(new ApiError(400, 'Please provide streamId or roomId'));

  const stream = await LiveStream.findOne(query);
  if (!stream) {
    return next(new ApiError(404, 'No active live stream session found for this room'));
  }

  stream.isLive = false;
  stream.endedAt = Date.now();
  stream.viewers = [];
  stream.viewerCount = 0;
  await stream.save();

  // Update profile status
  await CreatorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { isLive: false } }
  );

  // Notify viewers (stream room) + browse pages (global room) + creator that the stream ended
  const io = req.app.get('io');
  broadcastStreamLifecycle(io, stream, false);

  const durationSeconds = stream.startedAt
    ? Math.max(0, Math.floor((new Date(stream.endedAt).getTime() - new Date(stream.startedAt).getTime()) / 1000))
    : 0;

  res.status(200).json({
    status: 'success',
    message: 'Live stream ended successfully',
    durationSeconds,
    stream
  });
});

// Fan joins a live stream (charges entry fee when applicable, tracks viewers)
exports.joinLiveStream = catchAsync(async (req, res, next) => {
  const { streamId } = req.params;

  const stream = await LiveStream.findById(streamId);
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }
  if (!stream.isLive) {
    return next(new ApiError(400, 'This stream is not live right now'));
  }

  const isOwner = stream.creatorId.toString() === req.user._id.toString();
  let entryPaid = false;
  let chargeAmount = 0;

  if (!isOwner && stream.entryPriceCoins > 0) {
    // Subscribers enter free when the creator opted in.
    const freeForSub = stream.freeForSubscribers && await Subscription.exists({
      userId: req.user._id,
      creatorId: stream.creatorId,
      status: 'active',
      expiryDate: { $gt: new Date() }
    });

    if (!freeForSub) {
      const alreadyPaid = await Transaction.exists({
        senderId: req.user._id,
        type: 'live_entry',
        status: 'completed',
        referenceId: stream._id
      });
      if (!alreadyPaid) {
        await walletService.transferCoins(req.user._id, stream.creatorId, stream.entryPriceCoins, 'live_entry', stream._id);
        entryPaid = true;
        chargeAmount = stream.entryPriceCoins;
      } else {
        entryPaid = true; // already paid earlier
      }
    }
  }

  // Track the viewer atomically (dedupe, keep counts accurate across concurrent joins)
  let finalViewerCount = stream.viewerCount || 0;
  let freshTotalViews = stream.totalViews || 0;
  if (!isOwner) {
    const upd = await LiveStream.updateOne(
      { _id: stream._id, viewers: { $ne: req.user._id } },
      { $addToSet: { viewers: req.user._id }, $inc: { viewerCount: 1, totalViews: 1 } }
    );
    if (upd.modifiedCount > 0) {
      // Re-read the authoritative counts after the atomic update so concurrent
      // joins/leaves can't emit stale viewer numbers.
      const fresh = await LiveStream.findById(stream._id).select('viewerCount peakViewers totalViews');
      if (fresh) {
        finalViewerCount = fresh.viewerCount || 0;
        freshTotalViews = fresh.totalViews || 0;
        if ((fresh.peakViewers || 0) < finalViewerCount) {
          await LiveStream.updateOne(
            { _id: stream._id, peakViewers: { $lt: finalViewerCount } },
            { $set: { peakViewers: finalViewerCount } }
          );
        }
      }
    }
  }

  // Creator publishes, fans watch
  const privilege = isOwner ? 2 : 1;
  const agoraToken = agoraService.generateAgoraToken(req.user._id, stream.roomId, privilege);

  let creatorName = '';
  const profile = await CreatorProfile.findOne({ userId: stream.creatorId }).select('displayName username');
  if (profile) creatorName = profile.displayName || profile.username;

  // Real-time viewer count broadcast (stream room + creator's personal room)
  const io = req.app.get('io');
  broadcastLiveViewerCount(io, stream._id, stream.creatorId, finalViewerCount, true);

  res.status(200).json({
    status: 'success',
    message: entryPaid
      ? `Entry fee of ${chargeAmount} coins charged`
      : isOwner ? 'Stream joined as creator' : 'Stream joined',
    entryPaid,
    chargeAmount,
    viewerCount: finalViewerCount,
    totalViews: freshTotalViews,
    streamTitle: stream.streamTitle,
    category: stream.category,
    coverUrl: stream.coverUrl,
    creatorName,
    isOwner,
    roomId: stream.roomId,
    agoraToken
  });
});

// Fan leaves a live stream
exports.leaveLiveStream = catchAsync(async (req, res, next) => {
  const { streamId } = req.params;

  const before = await LiveStream.findById(streamId).select('viewerCount creatorId');
  if (!before) {
    return next(new ApiError(404, 'Live stream not found'));
  }

  const upd = await LiveStream.updateOne(
    { _id: streamId, viewers: req.user._id },
    { $pull: { viewers: req.user._id }, $inc: { viewerCount: -1 } }
  );

  let newCount = before.viewerCount || 0;
  if (upd.modifiedCount > 0) {
    // Re-read the authoritative count after the atomic decrement.
    const fresh = await LiveStream.findById(streamId).select('viewerCount');
    newCount = fresh ? Math.max(0, fresh.viewerCount || 0) : Math.max(0, newCount - 1);
  }

  // Real-time viewer count broadcast
  const io = req.app.get('io');
  broadcastLiveViewerCount(io, streamId, before.creatorId, newCount, true);

  res.status(200).json({
    status: 'success',
    viewerCount: newCount
  });
});

// Creator toggles call availability
exports.toggleCallAvailability = catchAsync(async (req, res, next) => {
  const { type, available } = req.body; // type: 'audio' or 'video'

  if (!['audio', 'video'].includes(type) || available === undefined) {
    return next(new ApiError(400, 'Please provide valid type (audio/video) and available state (boolean)'));
  }

  const updateField = type === 'audio' ? 'audioAvailable' : 'videoAvailable';
  
  const profile = await CreatorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { [updateField]: !!available } },
    { new: true }
  );

  if (!profile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  res.status(200).json({
    status: 'success',
    profile
  });
});

// Retrieve creator's subscribers list (all statuses with derived "expiring")
exports.getCreatorSubscribers = catchAsync(async (req, res, next) => {
  const {
    status, search, sort, page = 1, limit = 10, period = 'All Time',
    plan, minSpend, maxSpend, verifiedOnly, onlineOnly
  } = req.query;
  const { getPeriodStart } = require('../utils/periodRange');

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const EXPIRING_SOON_DAYS = 7;
  const deriveStatus = (sub) => {
    if (sub.status === 'cancelled' || sub.status === 'expired') return sub.status;
    const msLeft = new Date(sub.expiryDate).getTime() - Date.now();
    if (msLeft <= 0) return 'expired';
    if (msLeft < EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000) return 'expiring';
    return 'active';
  };

  const periodStart = getPeriodStart(period);

  // Fetch all subscriptions for this creator
  const subs = await Subscription.find({ creatorId: req.user._id })
    .populate('userId', 'username displayName avatarUrl email isVerified isOnline')
    .sort({ createdAt: -1 });

  // Compute total spent per subscriber (sum of subscription transactions to this creator)
  const txAgg = await Transaction.aggregate([
    {
      $match: {
        receiverId: req.user._id,
        senderId: { $exists: true, $ne: null },
        type: 'subscription',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$senderId',
        totalSpent: { $sum: '$amountCoins' },
        txCount: { $sum: 1 }
      }
    }
  ]);
  const spendMap = {};
  txAgg.forEach((t) => {
    spendMap[t._id.toString()] = { totalSpent: t.totalSpent, txCount: t.txCount };
  });

  // Build enriched subscriber rows
  let rows = subs.map((sub) => {
    const user = sub.userId;
    const spend = spendMap[sub.userId._id.toString()] || { totalSpent: 0, txCount: 0 };
    const statusLabel = deriveStatus(sub);
    const daysToRenewal = sub.expiryDate
      ? Math.ceil((new Date(sub.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : 0;
    return {
      _id: sub._id,
      userId: sub.userId._id,
      name: user.displayName || user.username,
      username: user.username,
      avatar: user.avatarUrl || '',
      email: user.email,
      plan: sub.plan,
      planPrice: sub.priceCoins,
      renewalDate: sub.expiryDate,
      daysUntilRenewal: daysToRenewal,
      status: statusLabel,
      totalSpentCoins: spend.totalSpent,
      transactionsCount: spend.txCount,
      isVerified: !!user.isVerified,
      isOnline: !!user.isOnline
    };
  });

  // Filter by status tab
  if (status) {
    const statusKey = status.toLowerCase();
    if (['active', 'expiring', 'expired', 'cancelled'].includes(statusKey)) {
      rows = rows.filter((r) => r.status === statusKey);
    } else if (statusKey !== 'all') {
      // pass-through for "All Subscribers"
    }
  }

  // Search by name / username / email
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
    );
  }

  // Filter by plan (single or comma-separated multi-select)
  if (plan && plan !== 'all') {
    const plans = plan.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (plans.length > 0) {
      rows = rows.filter((r) => plans.includes((r.plan || '').toLowerCase()));
    }
  }

  // Filter by total spend range
  const min = Number(minSpend);
  const max = Number(maxSpend);
  if (minSpend !== undefined && minSpend !== '' && !Number.isNaN(min)) {
    rows = rows.filter((r) => r.totalSpentCoins >= min);
  }
  if (maxSpend !== undefined && maxSpend !== '' && !Number.isNaN(max)) {
    rows = rows.filter((r) => r.totalSpentCoins <= max);
  }

  // Only verified / online subscribers
  if (verifiedOnly === 'true') rows = rows.filter((r) => r.isVerified);
  if (onlineOnly === 'true') rows = rows.filter((r) => r.isOnline);

  // Sort
  if (sort === 'newest') {
    rows.sort((a, b) => new Date(b.renewalDate) - new Date(a.renewalDate));
  } else if (sort === 'spent') {
    rows.sort((a, b) => b.totalSpentCoins - a.totalSpentCoins);
  } else if (sort === 'plan') {
    rows.sort((a, b) => a.plan.localeCompare(b.plan));
  } else {
    // default: renewal date ascending (soonest first)
    rows.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
  }

  // Pagination
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limitNum));
  const paged = rows.slice(skip, skip + limitNum);

  // Stats cards
  const activeCount = subs.filter((s) => deriveStatus(s) === 'active').length;
  const expiringCount = subs.filter((s) => deriveStatus(s) === 'expiring').length;
  const expiredCount = subs.filter((s) => deriveStatus(s) === 'expired').length;
  const cancelledCount = subs.filter((s) => deriveStatus(s) === 'cancelled').length;

  // MRR = sum of monthly prices for all active+expiring subscriptions
  let mrr = 0;
  for (const sub of subs) {
    const st = deriveStatus(sub);
    if (st === 'active' || st === 'expiring') mrr += sub.priceCoins || 0;
  }

  // New subscribers in the selected period (from createdAt)
  const newThisMonth = periodStart
    ? subs.filter((s) => new Date(s.createdAt).getTime() >= periodStart.getTime()).length
    : subs.length;

  // Plan breakdown (active + expiring only)
  const planCounts = {};
  const planColors = { Basic: '#10b981', Premium: '#3b82f6', VIP: '#f59e0b' };
  for (const sub of subs) {
    const st = deriveStatus(sub);
    if (st === 'active' || st === 'expiring') {
      planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
    }
  }
  const planTotal = Object.values(planCounts).reduce((a, b) => a + b, 0) || 1;
  const planBreakdown = {
    total: planTotal,
    categories: Object.entries(planCounts).map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / planTotal) * 100),
      color: planColors[label] || '#8b5cf6'
    }))
  };

  // Top subscribers by total spent (all-time)
  const topSubscribers = [...rows]
    .sort((a, b) => b.totalSpentCoins - a.totalSpentCoins)
    .slice(0, 5)
    .map((r) => ({
      id: r.userId,
      name: r.name,
      username: r.username,
      avatar: r.avatar,
      spent: r.totalSpentCoins
    }));

  // Overview growth chart (subscriptions created over the selected period)
  const overview = { total: periodStart ? subs.filter((s) => new Date(s.createdAt) >= periodStart).length : subs.length, chartData: [] };
  const chartCount = 5;
  const rangeEnd = periodStart ? Date.now() : Date.now();
  const rangeStart = periodStart ? periodStart.getTime() : (Date.now() - 4 * 7 * 24 * 60 * 60 * 1000);
  const bucketMs = Math.max(1, (rangeEnd - rangeStart) / chartCount);
  const weeks = [];
  for (let i = 0; i < chartCount; i++) {
    const s = rangeStart + i * bucketMs;
    const e = i === chartCount - 1 ? rangeEnd + 1 : rangeStart + (i + 1) * bucketMs;
    const count = subs.filter((sub) => {
      const t = new Date(sub.createdAt).getTime();
      return t >= s && t < e;
    }).length;
    const label = new Date(e).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    weeks.push({ label, value: count });
  }
  overview.chartData = weeks;

  // Engagement insights (aggregate across subscribers, within selected period).
  // The change % is computed against the previous window of the same length so
  // the arrow + colour reflects a real gain (green) or loss (red).
  const nowTs = Date.now();
  const periodStartTs = periodStart ? periodStart.getTime() : null;
  const prevWindowStart = periodStartTs
    ? new Date(periodStartTs - (nowTs - periodStartTs))
    : null;

  const periodMatch = periodStart ? { createdAt: { $gte: periodStart } } : {};
  const prevPeriodMatch = prevWindowStart
    ? { createdAt: { $gte: prevWindowStart, $lt: periodStart } }
    : {};

  const aggSpend = async (match) => {
    const [tipAgg, ppvAgg, subAgg] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            receiverId: req.user._id,
            senderId: { $exists: true, $ne: null },
            type: { $in: ['tip', 'gift'] },
            status: 'completed',
            ...match
          }
        },
        { $group: { _id: null, total: { $sum: '$amountCoins' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            receiverId: req.user._id,
            senderId: { $exists: true, $ne: null },
            type: 'ppv_unlock',
            status: 'completed',
            ...match
          }
        },
        { $group: { _id: null, total: { $sum: '$amountCoins' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            receiverId: req.user._id,
            senderId: { $exists: true, $ne: null },
            type: 'subscription',
            status: 'completed',
            ...match
          }
        },
        { $group: { _id: null, total: { $sum: '$amountCoins' }, count: { $sum: 1 } } }
      ])
    ]);
    return {
      tips: tipAgg[0] || { total: 0, count: 0 },
      ppv: ppvAgg[0] || { total: 0, count: 0 },
      subs: subAgg[0] || { total: 0, count: 0 }
    };
  };

  const cur = await aggSpend(periodMatch);
  const prev = prevWindowStart
    ? await aggSpend(prevPeriodMatch)
    : { tips: { total: 0, count: 0 }, ppv: { total: 0, count: 0 }, subs: { total: 0, count: 0 } };

  // Subscribers whose subscription overlapped a window (proxy for the active base)
  const activeInWindow = (startTs, endTs) =>
    subs.filter((s) => {
      const created = new Date(s.createdAt).getTime();
      const expiry = s.expiryDate ? new Date(s.expiryDate).getTime() : endTs;
      return created < endTs && expiry >= startTs;
    }).length;

  const curActive = Math.max(1, activeInWindow(periodStartTs || 0, nowTs));
  const prevActive = prevWindowStart
    ? Math.max(1, activeInWindow(prevWindowStart.getTime(), periodStartTs))
    : 1;

  const curTipsAvg = cur.tips.total / curActive;
  const prevTipsAvg = prev.tips.total / prevActive;
  const curPpvCount = cur.ppv.count;
  const prevPpvCount = prev.ppv.count;
  const curSpendAvg = (cur.tips.total + cur.ppv.total + cur.subs.total) / curActive;
  const prevSpendAvg = (prev.tips.total + prev.ppv.total + prev.subs.total) / prevActive;

  const pctChange = (current, previous) => {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const makeInsight = (label, curVal, prevVal, fmt) => {
    const change = prevWindowStart ? pctChange(curVal, prevVal) : 0;
    return {
      label,
      value: fmt(curVal),
      change: `${Math.abs(change)}%`,
      changeType: change >= 0 ? 'positive' : 'negative'
    };
  };

  const engagementInsights = [
    makeInsight('Avg. Tips Received', curTipsAvg, prevTipsAvg, (v) => v.toFixed(1)),
    makeInsight('PPV Purchases', curPpvCount, prevPpvCount, (v) => String(v)),
    makeInsight('Avg. Spend / Subscriber', curSpendAvg, prevSpendAvg, (v) => v.toFixed(1))
  ];

  res.status(200).json({
    status: 'success',
    subscribers: paged,
    stats: {
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount,
      cancelled: cancelledCount,
      mrr: Number(mrr.toFixed(2)),
      newThisMonth
    },
    overview,
    planBreakdown,
    topSubscribers,
    engagementInsights,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  });
});


