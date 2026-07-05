const Post = require('../models/Post');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const awsService = require('../services/aws.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

/**
 * Check if user has access to view full media of the post
 */
const checkMediaAccess = async (user, post) => {
  // Admins always have access
  if (user.role === 'admin') {
    return true;
  }

  // Creators always have access to their own posts
  if (post.creatorId.toString() === user._id.toString()) {
    return true;
  }

  // Free posts are accessible to everyone
  if (post.postType === 'free') {
    return true;
  }

  // Subscription posts require active subscription to the creator
  if (post.postType === 'subscription') {
    const activeSub = await Subscription.findOne({
      userId: user._id,
      creatorId: post.creatorId,
      status: 'active',
      expiryDate: { $gt: new Date() }
    });
    return !!activeSub;
  }

  // PPV posts require a successful purchase transaction
  if (post.postType === 'ppv') {
    const purchased = await Transaction.findOne({
      senderId: user._id,
      type: 'ppv_unlock',
      status: 'completed',
      referenceId: post._id
    });
    return !!purchased;
  }

  return false;
};

/**
 * Format post media URLs by replacing private S3 URLs with presigned ones, 
 * or masking them if user has no access.
 */
const formatPostForUser = async (user, post) => {
  const hasAccess = await checkMediaAccess(user, post);

  const formattedMedia = await Promise.all(
    post.media.map(async (item) => {
      let signedUrl = item.url;
      
      if (hasAccess) {
        if (item.url && item.url.includes('.amazonaws.com/')) {
          const key = item.url.split('.amazonaws.com/')[1];
          try {
            signedUrl = await awsService.getPresignedDownloadUrl(key);
          } catch (err) {
            console.error(`[AWS S3] Error generating download URL for key ${key}:`, err);
          }
        }

        return {
          _id: item._id,
          url: signedUrl,
          thumbnailUrl: item.thumbnailUrl || item.url,
          type: item.type,
          isLocked: false
        };
      } else {
        // Return masked media with thumbnail preview URL
        return {
          _id: item._id,
          url: null,
          thumbnailUrl: item.thumbnailUrl || item.url,
          type: item.type,
          isLocked: true
        };
      }
    })
  );

  return {
    _id: post._id,
    creatorId: post.creatorId,
    content: post.content,
    postType: post.postType,
    coinPrice: post.coinPrice,
    likesCount: post.likes.length,
    isLiked: post.likes.includes(user._id),
    commentsCount: post.commentCount,
    comments: post.comments,
    media: formattedMedia,
    createdAt: post.createdAt,
    hasAccess
  };
};

// Create a new post
exports.createPost = catchAsync(async (req, res, next) => {
  const { content, media, postType, coinPrice, scheduledFor } = req.body;

  if (postType === 'ppv' && (!coinPrice || coinPrice <= 0)) {
    return next(new ApiError(400, 'PPV posts must have a coin price greater than 0'));
  }

  const post = await Post.create({
    creatorId: req.user._id,
    content,
    media: media || [],
    postType: postType || 'free',
    coinPrice: postType === 'ppv' ? coinPrice : 0,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null
  });

  res.status(201).json({
    status: 'success',
    post
  });
});

// Retrieve custom feed (subscribed creators + public posts)
exports.getFeed = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit || '10', 10);
  const nextCursor = req.query.nextCursor;

  const query = { isPublished: true };

  // Cursor pagination filter
  if (nextCursor) {
    query._id = { $lt: nextCursor };
  }

  // Retrieve posts
  const dbPosts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasMore = dbPosts.length > limit;
  if (hasMore) {
    dbPosts.pop();
  }

  const formattedPosts = await Promise.all(
    dbPosts.map(async (post) => await formatPostForUser(req.user, post))
  );

  const mockPosts = [
    {
      _id: 'mock-post-1',
      creatorId: {
        _id: 'mock-creator-1',
        displayName: 'Molly Jane',
        username: 'mollyjane',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
        isVerifiedBadge: true
      },
      content: 'Had an amazing workout session today! 💪 Keeping up the grind! What are you guys up to today?',
      postType: 'free',
      coinPrice: 0,
      likesCount: 124,
      isLiked: false,
      commentsCount: 12,
      giftCount: 8,
      media: [{
        _id: 'mock-media-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
        isLocked: false
      }],
      createdAt: new Date(Date.now() - 3600000),
      hasAccess: true,
      comments: [
        { userId: { displayName: 'John Doe', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80' }, text: 'Incredible dedication!' }
      ]
    },
    {
      _id: 'mock-post-2',
      creatorId: {
        _id: 'mock-creator-2',
        displayName: 'Leslie Alexander',
        username: 'lesliealexander',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isVerifiedBadge: true
      },
      content: 'Check out my new choreography! 💃 Let me know what you think in the comments!',
      postType: 'free',
      coinPrice: 0,
      likesCount: 382,
      isLiked: true,
      commentsCount: 45,
      giftCount: 14,
      media: [{
        _id: 'mock-media-2',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40030-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        isLocked: false
      }],
      createdAt: new Date(Date.now() - 7200000),
      hasAccess: true,
      comments: []
    },
    {
      _id: 'mock-post-3',
      creatorId: {
        _id: 'mock-creator-3',
        displayName: 'Savannah',
        username: 'savannah',
        avatarUrl: '/Girl.png',
        isVerifiedBadge: true
      },
      content: "Unlock my exclusive behind-the-scenes video from the last photo shoot! 📸 You don't want to miss this! 🔥",
      postType: 'ppv',
      coinPrice: 50,
      likesCount: 750,
      isLiked: false,
      commentsCount: 89,
      giftCount: 32,
      media: [{
        _id: 'mock-media-3',
        type: 'video',
        url: null,
        thumbnailUrl: '/Girl.png',
        isLocked: true
      }],
      createdAt: new Date(Date.now() - 10800000),
      hasAccess: false,
      comments: []
    },
    {
      _id: 'mock-post-4',
      creatorId: {
        _id: 'mock-creator-4',
        displayName: 'Jenny Wilson',
        username: 'jennywilson',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
        isVerifiedBadge: true
      },
      content: 'Premium sneak peek from my upcoming summer collection! ☀️ Unlock to see the full set!',
      postType: 'ppv',
      coinPrice: 20,
      likesCount: 230,
      isLiked: false,
      commentsCount: 18,
      giftCount: 5,
      media: [{
        _id: 'mock-media-4',
        type: 'image',
        url: null,
        thumbnailUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        isLocked: true
      }],
      createdAt: new Date(Date.now() - 14400000),
      hasAccess: false,
      comments: []
    },
    {
      _id: 'mock-post-5',
      creatorId: {
        _id: 'mock-creator-5',
        displayName: 'Kristin Watson',
        username: 'kristinwatson',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
        isVerifiedBadge: true
      },
      content: 'Listen to my voice note update! Sending you good vibes for the day! 🎙️❤️',
      postType: 'free',
      coinPrice: 0,
      likesCount: 98,
      isLiked: false,
      commentsCount: 7,
      giftCount: 3,
      media: [{
        _id: 'mock-media-5',
        type: 'audio',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        thumbnailUrl: 'https://images.unsplash.com/photo-1484755560693-a4074577af3a?auto=format&fit=crop&w=400&q=80',
        isLocked: false
      }],
      createdAt: new Date(Date.now() - 18000000),
      hasAccess: true,
      comments: []
    }
  ];

  const allPosts = [...formattedPosts, ...mockPosts];

  const lastPost = dbPosts[dbPosts.length - 1];
  const nextCursorVal = hasMore && lastPost ? lastPost._id : null;

  res.status(200).json({
    status: 'success',
    posts: allPosts,
    nextCursor: nextCursorVal
  });
});

// Retrieve media feed filtered by images or videos
exports.getMediaFeed = catchAsync(async (req, res, next) => {
  const { mediaType } = req.params; // 'video' or 'image'
  const limit = parseInt(req.query.limit || '10', 10);
  const nextCursor = req.query.nextCursor;

  if (!['video', 'image'].includes(mediaType)) {
    return next(new ApiError(400, 'Invalid media type filter. Must be video or image.'));
  }

  const query = {
    isPublished: true,
    'media.type': mediaType
  };

  if (nextCursor) {
    query._id = { $lt: nextCursor };
  }

  const posts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  if (hasMore) {
    posts.pop();
  }

  const formattedPosts = await Promise.all(
    posts.map(async (post) => await formatPostForUser(req.user, post))
  );

  const lastPost = posts[posts.length - 1];
  const nextCursorVal = hasMore && lastPost ? lastPost._id : null;

  res.status(200).json({
    status: 'success',
    posts: formattedPosts,
    nextCursor: nextCursorVal
  });
});

// Access-control media server redirection endpoint
exports.getPostMedia = catchAsync(async (req, res, next) => {
  const { postId, mediaId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  const mediaItem = post.media.id(mediaId);
  if (!mediaItem) {
    return next(new ApiError(404, 'Media item not found'));
  }

  // Run access control checks
  const hasAccess = await checkMediaAccess(req.user, post);
  if (!hasAccess) {
    return next(new ApiError(403, 'Access denied. Purchase or subscription required.'));
  }

  // Generate 1-hour presigned S3 download URL
  let key = mediaItem.url;
  if (mediaItem.url.includes('.amazonaws.com/')) {
    key = mediaItem.url.split('.amazonaws.com/')[1];
  }

  const presignedUrl = await awsService.getPresignedDownloadUrl(key);

  // Redirect to actual secure S3 path
  res.redirect(302, presignedUrl);
});

// Like or Unlike a post
exports.likePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  const index = post.likes.indexOf(req.user._id);
  if (index === -1) {
    post.likes.push(req.user._id);
  } else {
    post.likes.splice(index, 1);
  }

  await post.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    likesCount: post.likes.length,
    isLiked: index === -1
  });
});

// Add a comment to a post
exports.commentPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;

  if (!text) {
    return next(new ApiError(400, 'Comment text is required'));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  post.comments.push({
    userId: req.user._id,
    text
  });

  await post.save({ validateBeforeSave: false });

  const updatedPost = await Post.findById(postId)
    .populate('comments.userId', 'username displayName avatarUrl');

  res.status(201).json({
    status: 'success',
    comments: updatedPost.comments
  });
});

// Report a post
exports.reportPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return next(new ApiError(400, 'Reason for report is required'));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  post.reports.push({
    userId: req.user._id,
    reason
  });

  await post.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Post successfully reported'
  });
});

// Generate presigned upload URL for creators
exports.getPresignedUpload = catchAsync(async (req, res, next) => {
  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return next(new ApiError(400, 'Please provide fileName and fileType'));
  }

  const fileKey = `creators/${req.user._id}/${Date.now()}_${fileName}`;
  const uploadUrl = await awsService.getPresignedUploadUrl(fileKey, fileType);
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'fantrio';
  const region = process.env.AWS_REGION || 'us-east-1';
  const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;

  res.status(200).json({
    status: 'success',
    uploadUrl,
    key: fileKey,
    fileUrl
  });
});

// Share a post
exports.sharePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  post.sharesCount += 1;
  await post.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    sharesCount: post.sharesCount
  });
});

// Get trending hashtags
exports.getTrendingHashtags = catchAsync(async (req, res, next) => {
  const hashtags = [
    { tag: 'hot', postCount: '12.5K' },
    { tag: 'bikini', postCount: '12.5K' },
    { tag: 'fitness', postCount: '12.5K' },
    { tag: 'booty', postCount: '12.5K' }
  ];

  res.status(200).json({
    status: 'success',
    hashtags
  });
});
