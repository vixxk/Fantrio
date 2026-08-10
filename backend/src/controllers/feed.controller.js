const mongoose = require('mongoose');
const Post = require('../models/Post');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const CreatorProfile = require('../models/CreatorProfile');
const awsService = require('../services/aws.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const { getHiddenUserIds } = require('../utils/blockFilter');

/**
 * Check if user has access to view full media of the post
 */
const checkMediaAccess = async (user, post) => {
  if (user.role === 'admin') return true;
  if (post.creatorId.toString() === user._id.toString()) return true;
  if (post.postType === 'free') return true;
  if (post.postType === 'subscription') {
    const activeSub = await Subscription.findOne({
      userId: user._id,
      creatorId: post.creatorId,
      status: 'active',
      expiryDate: { $gt: new Date() }
    });
    return !!activeSub;
  }
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

const getCreatorDisplayMap = async (creatorIds) => {
  const uniqueIds = [...new Set(creatorIds.map((id) => id.toString()))];
  const profiles = await CreatorProfile.find({
    userId: { $in: uniqueIds }
  }).select('userId username displayName avatarUrl isVerifiedBadge');
  const map = {};
  profiles.forEach((p) => {
    map[p.userId.toString()] = {
      username: p.username,
      displayName: p.displayName || p.username,
      avatarUrl: p.avatarUrl || '',
      isVerifiedBadge: p.isVerifiedBadge || false
    };
  });
  return map;
};

const formatPostForUser = async (user, post, creatorDisplayMap, giftCounts) => {
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
        return { _id: item._id, url: signedUrl, thumbnailUrl: item.thumbnailUrl || item.url, type: item.type, isLocked: false, isBlurred: item.isBlurred !== undefined ? item.isBlurred : true };
      }
      return { _id: item._id, url: null, thumbnailUrl: item.thumbnailUrl || item.url, type: item.type, isLocked: true, isBlurred: item.isBlurred !== undefined ? item.isBlurred : true };
    })
  );

  const profile = creatorDisplayMap[post.creatorId.toString()] || {};

  const comments = post.comments.map((c) => ({
    _id: c._id,
    text: c.text,
    createdAt: c.createdAt,
    isGift: c.isGift || false,
    giftEmoji: c.giftEmoji || null,
    giftName: c.giftName || null,
    giftTier: c.giftTier || 1,
    giftCoins: c.giftCoins || 0,
    userId: c.userId
      ? { _id: c.userId._id, username: c.userId.username, displayName: c.userId.displayName || c.userId.username, avatarUrl: c.userId.avatarUrl || '' }
      : null
  }));

  const seenByArr = Array.isArray(post.seenBy) ? post.seenBy : [];
  const userIdStr = String(user._id);

  return {
    _id: post._id,
    creatorId: {
      _id: post.creatorId._id || post.creatorId,
      username: post.creatorId.username || profile.username,
      displayName: post.creatorId.displayName || profile.displayName || 'Creator',
      avatarUrl: post.creatorId.avatarUrl || profile.avatarUrl || '',
      isVerifiedBadge: profile.isVerifiedBadge
    },
    content: post.content,
    postType: post.postType,
    coinPrice: post.coinPrice,
    likesCount: post.likes.length,
    isLiked: post.likes.includes(user._id),
    commentsCount: post.commentCount || post.comments.length,
    comments,
    sharesCount: post.sharesCount || 0,
    giftCount: giftCounts[post.creatorId.toString()] || 0,
    isFollowing: user.following.includes(post.creatorId._id || post.creatorId),
    isSeen: seenByArr.some((id) => String(id) === userIdStr),
    hasCommented: comments.some((c) => c.userId && String(c.userId._id) === userIdStr),
    media: formattedMedia,
    createdAt: post.createdAt,
    hasAccess
  };
};

const getGiftCounts = async (creatorIds) => {
  const uniqueIds = [...new Set(creatorIds.map((id) => id.toString()))];
  const aggregation = await Transaction.aggregate([
    { $match: { type: 'tip', status: 'completed', receiverId: { $in: uniqueIds.map((id) => mongoose.Types.ObjectId.createFromHexString(id)) } } },
    { $group: { _id: '$receiverId', count: { $sum: 1 } } }
  ]);
  const map = {};
  aggregation.forEach((item) => { map[item._id.toString()] = item.count; });
  return map;
};

const getHiddenByVisibility = async (user) => {
  if (user && user.role === 'admin') return [];
  const restricted = await CreatorProfile.find({
    profileVisibility: { $in: ['Private', 'Subscribers Only'] }
  }).select('userId profileVisibility').lean();
  if (restricted.length === 0) return [];
  const privateIds = [];
  const subOnlyIds = [];
  restricted.forEach((p) => {
    const id = String(p.userId);
    if (user && id === String(user._id)) return;
    if (p.profileVisibility === 'Private') privateIds.push(id);
    else subOnlyIds.push(id);
  });
  if (!user) return [...privateIds, ...subOnlyIds];
  if (subOnlyIds.length > 0) {
    const activeSubs = await Subscription.find({
      userId: user._id,
      creatorId: { $in: subOnlyIds },
      status: 'active',
      expiryDate: { $gt: new Date() }
    }).select('creatorId').lean();
    const subscribed = new Set(activeSubs.map((s) => String(s.creatorId)));
    return [...privateIds, ...subOnlyIds.filter((id) => !subscribed.has(id))];
  }
  return privateIds;
};

const canInteractWithCreator = async (user, creatorId) => {
  if (user.role === 'admin') return true;
  if (String(user._id) === String(creatorId)) return true;
  const profile = await CreatorProfile.findOne({ userId: creatorId }).select('profileVisibility').lean();
  if (!profile || !profile.profileVisibility || profile.profileVisibility === 'Public') return true;
  if (profile.profileVisibility === 'Private') return false;
  const activeSub = await Subscription.findOne({ userId: user._id, creatorId, status: 'active', expiryDate: { $gt: new Date() } });
  return !!activeSub;
};

exports.getHiddenByVisibility = getHiddenByVisibility;

const buildFeedQuery = async (user, search = null) => {
  const hiddenIds = await getHiddenUserIds(user._id);
  const visibilityHidden = await getHiddenByVisibility(user);
  const allHidden = [...new Set([...hiddenIds, ...visibilityHidden])];
  const query = { isPublished: true, isHidden: { $ne: true } };
  // Discovery feed: show all global content except subscription-only posts
  query.postType = { $ne: 'subscription' };
  if (allHidden.length > 0) {
    query.creatorId = { $nin: allHidden };
  }
  if (search && typeof search === 'string' && search.trim()) {
    query.content = { $regex: search.trim(), $options: 'i' };
  }
  return query;
};

// Fisher-Yates shuffle
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Discovery feed order: fresh (unseen/un-interacted) first, then seen/interacted
const orderForDiscovery = (posts) => {
  const fresh = [];
  const stale = [];
  posts.forEach((p) => {
    const interacted = p.isSeen || p.isLiked || p.hasCommented || p.isFollowing;
    (interacted ? stale : fresh).push(p);
  });
  return [...shuffle(fresh), ...shuffle(stale)];
};

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
  res.status(201).json({ status: 'success', post });
});

// Mark a post as seen by the current user (feed algorithm bookkeeping)
exports.markSeen = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  const userId = req.user._id;
  const seenByArr = Array.isArray(post.seenBy) ? post.seenBy : [];
  if (!seenByArr.some((id) => id.toString() === userId.toString())) {
    seenByArr.push(userId);
    post.seenBy = seenByArr;
    await post.save({ validateBeforeSave: false });
  }
  res.status(200).json({ status: 'success', isSeen: true });
});

// Discovery feed: fresh content first (randomized), seen/interacted last
exports.getFeed = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit || '10', 10);
  const nextCursor = req.query.nextCursor;
  const search = req.query.search;

  const query = await buildFeedQuery(req.user, search);
  if (nextCursor) query._id = { $lt: nextCursor };

  const poolSize = limit * 3;
  const dbPosts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ _id: -1 })
    .limit(poolSize);

  const creatorIds = dbPosts.map((p) => p.creatorId._id.toString());
  const [creatorDisplayMap, giftCounts] = await Promise.all([
    getCreatorDisplayMap(creatorIds),
    getGiftCounts(creatorIds)
  ]);

  const formattedPosts = await Promise.all(
    dbPosts.map(async (post) => await formatPostForUser(req.user, post, creatorDisplayMap, giftCounts))
  );

  // Apply discovery ordering, then take exactly `limit` posts
  const ordered = orderForDiscovery(formattedPosts).slice(0, limit);

  // Build a cursor from the oldest post in the pool that wasn't served
  const servedIds = new Set(ordered.map((p) => String(p._id)));
  const remaining = formattedPosts.filter((p) => !servedIds.has(String(p._id)));
  const lastPost = remaining[remaining.length - 1];
  const nextCursorVal = remaining.length > 0 && lastPost ? lastPost._id : null;

  res.status(200).json({ status: 'success', posts: ordered, nextCursor: nextCursorVal });
});

exports.getMediaFeed = catchAsync(async (req, res, next) => {
  const { mediaType } = req.params;
  const limit = parseInt(req.query.limit || '10', 10);
  const nextCursor = req.query.nextCursor;

  if (!['video', 'image', 'audio'].includes(mediaType)) {
    return next(new ApiError(400, 'Invalid media type filter. Must be video, image or audio.'));
  }

  const query = await buildFeedQuery(req.user);
  query['media.type'] = mediaType;
  if (nextCursor) query._id = { $lt: nextCursor };

  const posts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  const creatorIds = posts.map((p) => p.creatorId._id.toString());
  const [creatorDisplayMap, giftCounts] = await Promise.all([
    getCreatorDisplayMap(creatorIds),
    getGiftCounts(creatorIds)
  ]);

  const formattedPosts = await Promise.all(
    posts.map(async (post) => await formatPostForUser(req.user, post, creatorDisplayMap, giftCounts))
  );

  const lastPost = posts[posts.length - 1];
  const nextCursorVal = hasMore && lastPost ? lastPost._id : null;

  res.status(200).json({ status: 'success', posts: formattedPosts, nextCursor: nextCursorVal });
});

exports.getPostById = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new ApiError(400, 'Invalid Post ID'));
  }
  const post = await Post.findById(postId).populate('creatorId', 'username displayName avatarUrl');
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }
  const hiddenError = rejectIfHidden(req, post);
  if (hiddenError) return next(hiddenError);

  const creatorIds = [post.creatorId._id.toString()];
  const [creatorDisplayMap, giftCounts] = await Promise.all([
    getCreatorDisplayMap(creatorIds),
    getGiftCounts(creatorIds)
  ]);

  const formattedPost = await formatPostForUser(req.user, post, creatorDisplayMap, giftCounts);
  res.status(200).json({ status: 'success', post: formattedPost });
});

exports.getPostMedia = catchAsync(async (req, res, next) => {
  const { postId, mediaId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  if (post.isHidden && post.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(404, 'Post not found'));
  }
  const mediaItem = post.media.id(mediaId);
  if (!mediaItem) return next(new ApiError(404, 'Media item not found'));
  if (!(await canInteractWithCreator(req.user, post.creatorId))) {
    return next(new ApiError(403, 'This content is only available to subscribers.'));
  }
  const hasAccess = await checkMediaAccess(req.user, post);
  if (!hasAccess) return next(new ApiError(403, 'Access denied. Purchase or subscription required.'));
  let key = mediaItem.url;
  if (mediaItem.url.includes('.amazonaws.com/')) key = mediaItem.url.split('.amazonaws.com/')[1];
  const presignedUrl = await awsService.getPresignedDownloadUrl(key);
  res.redirect(302, presignedUrl);
});

const rejectIfHidden = (req, post) => {
  if (post.isHidden && post.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return new ApiError(404, 'Post not found');
  }
  return null;
};

exports.likePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  const hiddenError = rejectIfHidden(req, post);
  if (hiddenError) return next(hiddenError);
  if (!(await canInteractWithCreator(req.user, post.creatorId))) {
    return next(new ApiError(403, 'This content is only available to subscribers.'));
  }
  const index = post.likes.indexOf(req.user._id);
  if (index === -1) post.likes.push(req.user._id);
  else post.likes.splice(index, 1);
  await post.save({ validateBeforeSave: false });
  res.status(200).json({ status: 'success', likesCount: post.likes.length, isLiked: index === -1 });
});

exports.commentPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) return next(new ApiError(400, 'Comment text is required'));
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  const hiddenError = rejectIfHidden(req, post);
  if (hiddenError) return next(hiddenError);
  if (!(await canInteractWithCreator(req.user, post.creatorId))) {
    return next(new ApiError(403, 'This content is only available to subscribers.'));
  }
  post.comments.push({ userId: req.user._id, text: text.trim() });
  await post.save({ validateBeforeSave: false });
  const updatedPost = await Post.findById(postId).populate('comments.userId', 'username displayName avatarUrl');
  res.status(201).json({ status: 'success', comments: updatedPost.comments });
});

exports.reportPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { reason } = req.body;
  if (!reason || !reason.trim()) return next(new ApiError(400, 'Reason for report is required'));
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  const hiddenError = rejectIfHidden(req, post);
  if (hiddenError) return next(hiddenError);
  if (post.creatorId.toString() === req.user._id.toString()) return next(new ApiError(400, 'You cannot report your own post'));
  const alreadyReported = post.reports.some((r) => r.userId.toString() === req.user._id.toString());
  if (alreadyReported) return next(new ApiError(400, 'You have already reported this post'));
  post.reports.push({ userId: req.user._id, reason: reason.trim() });
  await post.save({ validateBeforeSave: false });
  res.status(200).json({ status: 'success', message: 'Post successfully reported' });
});

exports.getPresignedUpload = catchAsync(async (req, res, next) => {
  const { fileName, fileType } = req.body;
  if (!fileName || !fileType) return next(new ApiError(400, 'Please provide fileName and fileType'));
  const fileKey = `creators/${req.user._id}/${Date.now()}_${fileName}`;
  const uploadUrl = await awsService.getPresignedUploadUrl(fileKey, fileType);
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'fantrio';
  const region = process.env.AWS_REGION || 'us-east-1';
  const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
  res.status(200).json({ status: 'success', uploadUrl, key: fileKey, fileUrl });
});

exports.sharePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  const hiddenError = rejectIfHidden(req, post);
  if (hiddenError) return next(hiddenError);
  if (!(await canInteractWithCreator(req.user, post.creatorId))) {
    return next(new ApiError(403, 'This content is only available to subscribers.'));
  }
  post.sharesCount = (post.sharesCount || 0) + 1;
  await post.save({ validateBeforeSave: false });
  res.status(200).json({ status: 'success', sharesCount: post.sharesCount });
});

exports.getTrendingHashtags = catchAsync(async (req, res, next) => {
  const posts = await Post.find({ isPublished: true, isHidden: { $ne: true } }).select('content');
  const tagCounts = {};
  for (const post of posts) {
    const tags = (post.content || '').match(/#[\w]+/g) || [];
    for (const tag of tags) {
      const key = tag.slice(1).toLowerCase();
      if (key) tagCounts[key] = (tagCounts[key] || 0) + 1;
    }
  }
  const hashtags = Object.entries(tagCounts).map(([tag, postCount]) => ({ tag, postCount })).sort((a, b) => b.postCount - a.postCount).slice(0, 8);
  res.status(200).json({ status: 'success', hashtags });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { content, media, postType, coinPrice, scheduledFor, isHidden } = req.body;
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  if (post.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'You do not have permission to update this post'));
  }
  if (postType === 'ppv' && (!coinPrice || coinPrice <= 0)) return next(new ApiError(400, 'PPV posts must have a coin price greater than 0'));
  if (content !== undefined) post.content = content;
  if (media !== undefined) post.media = media;
  if (postType !== undefined) post.postType = postType;
  if (coinPrice !== undefined) post.coinPrice = postType === 'ppv' ? coinPrice : 0;
  if (scheduledFor !== undefined) post.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  if (isHidden !== undefined) post.isHidden = !!isHidden;
  await post.save();
  res.status(200).json({ status: 'success', post });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  if (post.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'You do not have permission to delete this post'));
  }
  const mediaUrls = [];
  (post.media || []).forEach((m) => { mediaUrls.push(m.url); if (m.thumbnailUrl) mediaUrls.push(m.thumbnailUrl); });
  await awsService.deleteS3Media(mediaUrls);
  await Post.findByIdAndDelete(postId);
  res.status(200).json({ status: 'success', message: 'Post successfully deleted' });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { postId, commentId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return next(new ApiError(404, 'Post not found'));
  const comment = post.comments.id(commentId);
  if (!comment) return next(new ApiError(404, 'Comment not found'));
  const isPostOwner = post.creatorId.toString() === req.user._id.toString();
  const isCommentAuthor = comment.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isPostOwner && !isCommentAuthor && !isAdmin) return next(new ApiError(403, 'You do not have permission to delete this comment'));
  post.comments.pull(commentId);
  await post.save({ validateBeforeSave: false });
  const updatedPost = await Post.findById(postId).populate('comments.userId', 'username displayName avatarUrl');
  res.status(200).json({ status: 'success', comments: updatedPost.comments });
});