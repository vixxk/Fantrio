const Post = require('../../models/Post');
const awsService = require('../../services/aws.service');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');

const collectPostMediaUrls = (post) => {
  const urls = [];
  (post.media || []).forEach((m) => {
    urls.push(m.url);
    if (m.thumbnailUrl) urls.push(m.thumbnailUrl);
  });
  return urls;
};

// Presign hosted media so admins can preview every attachment. External URLs
// (seeded external media) are already directly viewable and returned as-is.
const presignMediaUrl = async (mediaUrl) => {
  if (!mediaUrl) return '';
  const key = awsService.extractS3Key(mediaUrl);
  if (!key) return mediaUrl;
  try {
    return await awsService.getPresignedDownloadUrl(key);
  } catch (err) {
    console.error('[Media Storage] Error presigning post media:', err);
    return mediaUrl;
  }
};

const enrichPostMedia = async (post) => {
  const p = post.toObject ? post.toObject() : { ...post };
  p.media = await Promise.all(
    (post.media || []).map(async (m) => ({
      ...m,
      url: await presignMediaUrl(m.url),
      thumbnailUrl: m.thumbnailUrl ? await presignMediaUrl(m.thumbnailUrl) : null
    }))
  );
  return p;
};

// Retrieve all posts. Optional `filter` query param: 'open' (published and
// not hidden), 'closed' (scheduled/unpublished or creator-hidden), 'ppv'
exports.getAllPosts = catchAsync(async (req, res, next) => {
  const User = require('../../models/User');
  const { search, from, to, filter } = req.query;
  const query = {};
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchedUsers = await User.find({
      $or: [{ displayName: searchRegex }, { username: searchRegex }, { email: searchRegex }]
    }).select('_id').lean();
    const userIds = matchedUsers.map((u) => u._id);

    query.$or = [
      { content: searchRegex },
      { postType: searchRegex },
      { creatorId: { $in: userIds } }
    ];
  }
  if (filter === 'open') {
    query.isPublished = true;
    query.isHidden = false;
  } else if (filter === 'closed') {
    query.$or = [{ isPublished: false }, { isHidden: true }];
  } else if (filter === 'ppv') {
    query.postType = 'ppv';
  }
  Object.assign(query, buildDateRangeQuery(from, to));

  const posts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });

  const enriched = await Promise.all(posts.map(enrichPostMedia));

  res.status(200).json({
    status: 'success',
    posts: enriched
  });
});

// Delete an existing post
exports.deletePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  await awsService.deleteS3Media(collectPostMediaUrls(post));
  await Post.findByIdAndDelete(postId);

  res.status(200).json({
    status: 'success',
    message: 'Post successfully deleted'
  });
});

// Retrieve reported posts. Only post-related reports are shown: posts reported
// via the feed (embedded `reports` array) plus standalone content reports
// (Report model with targetType 'content') — creator reports are excluded here.
exports.getReportedPosts = catchAsync(async (req, res, next) => {
  const { search, from, to } = req.query;
  const query = { 'reports.0': { $exists: true } };
  if (search) query.content = { $regex: search, $options: 'i' };
  Object.assign(query, buildDateRangeQuery(from, to));

  // Posts reported through the feed (embedded reports array)
  const posts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .populate('reports.userId', 'username displayName')
    .sort({ 'reports.date': -1 });

  // Posts reported through More -> Report Content (standalone Report docs with
  // targetType 'content'). Merge them into the same shape so every post report
  // lands in the moderation queue, regardless of which flow submitted it.
  // Already-resolved reports stay resolved (dismissing a post resolves its
  // standalone reports, so they must not be folded back in).
  const Report = require('../../models/Report');
  const standalone = await Report.find({
    targetType: 'content',
    status: { $ne: 'resolved' },
    ...buildDateRangeQuery(from, to)
  }).populate('reporterId', 'username displayName avatarUrl');

  const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
  if (standalone.length) {
    const standalonePostIds = [...new Set(standalone.map((r) => r.targetId))];
    const standalonePosts = await Post.find({ _id: { $in: standalonePostIds } })
      .populate('creatorId', 'username displayName avatarUrl');
    const standalonePostMap = new Map(standalonePosts.map((p) => [p._id.toString(), p]));
    for (const r of standalone) {
      const post = standalonePostMap.get(r.targetId.toString());
      if (!post) continue;
      const key = post._id.toString();
      const existing = postMap.get(key);
      const entry = {
        userId: r.reporterId ? r.reporterId._id : null,
        reason: r.reason,
        description: r.description || '',
        date: r.createdAt,
        source: 'standalone'
      };
      if (existing) {
        if (!existing.toObject().reports.some((x) => x.date && x.date.getTime() === r.createdAt.getTime())) {
          existing.reports.push(entry);
        }
      } else {
        post.reports = [entry];
        postMap.set(key, post);
      }
    }
  }

  let combined = [...postMap.values()];
  if (search) {
    const q = search.toLowerCase();
    combined = combined.filter((p) => {
      const creatorStr = p.creatorId ? `${p.creatorId.displayName} ${p.creatorId.username} ${p.creatorId.email}` : '';
      const contentStr = String(p.content || '');
      const idStr = String(p._id || '');
      const postTypeStr = String(p.postType || '');
      const reportReasons = (p.reports || []).map((r) => `${r.reason || ''} ${r.description || ''} ${r.userId?.displayName || ''} ${r.userId?.username || ''}`).join(' ');
      const dateStr = new Date(p.createdAt).toLocaleDateString();
      return (
        creatorStr.toLowerCase().includes(q) ||
        contentStr.toLowerCase().includes(q) ||
        idStr.toLowerCase().includes(q) ||
        postTypeStr.toLowerCase().includes(q) ||
        reportReasons.toLowerCase().includes(q) ||
        dateStr.toLowerCase().includes(q)
      );
    });
  }
  const latestReportDate = (p) => {
    if (!p.reports || !p.reports.length) return new Date(p.createdAt);
    return new Date(Math.max(...p.reports.map((r) => new Date(r.date).getTime())));
  };
  combined.sort((a, b) => latestReportDate(b) - latestReportDate(a));

  const enriched = await Promise.all(combined.map(enrichPostMedia));

  res.status(200).json({
    status: 'success',
    posts: enriched
  });
});

// Take action on reported content (dismiss or delete)
exports.moderatePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { action } = req.body; // 'dismiss' or 'delete'

  if (!['dismiss', 'delete'].includes(action)) {
    return next(new ApiError(400, "Please provide valid moderation action: 'dismiss' or 'delete'"));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  if (action === 'delete') {
    await awsService.deleteS3Media(collectPostMediaUrls(post));
    await Post.findByIdAndDelete(postId);
    // Clean up standalone content reports pointing at the removed post
    const Report = require('../../models/Report');
    await Report.deleteMany({ targetType: 'content', targetId: postId });
    res.status(200).json({
      status: 'success',
      message: 'Post successfully deleted'
    });
  } else {
    // Dismiss reports: clear the embedded post reports AND resolve the matching
    // standalone content reports so they are not folded back into the queue.
    post.reports = [];
    await post.save({ validateBeforeSave: false });
    const Report = require('../../models/Report');
    await Report.updateMany(
      { targetType: 'content', targetId: postId, status: { $ne: 'resolved' } },
      { $set: { status: 'resolved' } }
    );
    res.status(200).json({
      status: 'success',
      message: 'Reports dismissed'
    });
  }
});
