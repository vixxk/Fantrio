const Post = require('../../models/Post');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all posts
exports.getAllPosts = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const query = {};
  if (search) query.content = { $regex: search, $options: 'i' };

  const posts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    posts
  });
});

// Delete an existing post
exports.deletePost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new ApiError(404, 'Post not found'));
  }

  await Post.findByIdAndDelete(postId);

  res.status(200).json({
    status: 'success',
    message: 'Post successfully deleted'
  });
});

// Retrieve all reported posts
exports.getReportedPosts = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const query = { 'reports.0': { $exists: true } };
  if (search) query.content = { $regex: search, $options: 'i' };

  const posts = await Post.find(query)
    .populate('creatorId', 'username displayName avatarUrl')
    .populate('reports.userId', 'username displayName')
    .sort({ 'reports.date': -1 });

  res.status(200).json({
    status: 'success',
    posts
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
    await Post.findByIdAndDelete(postId);
    res.status(200).json({
      status: 'success',
      message: 'Post successfully deleted'
    });
  } else {
    // Dismiss reports
    post.reports = [];
    await post.save({ validateBeforeSave: false });
    res.status(200).json({
      status: 'success',
      message: 'Reports dismissed'
    });
  }
});
