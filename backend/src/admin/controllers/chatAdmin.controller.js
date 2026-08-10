const Message = require('../../models/Message');
const User = require('../../models/User');
const awsService = require('../../services/aws.service');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');

// Admins are allowed to view every attachment (including paywalled media), so
// presign all media URLs. Non-S3 URLs (seeded external media) are already
// directly viewable and returned as-is (extractS3Key returns null for them).
const presignMediaUrl = async (mediaUrl) => {
  if (!mediaUrl) return '';
  const key = awsService.extractS3Key(mediaUrl);
  if (!key) return mediaUrl;
  try {
    return await awsService.getPresignedDownloadUrl(key);
  } catch (err) {
    console.error('[AWS S3] Error presigning message media:', err);
    return mediaUrl;
  }
};

// Retrieve all messages for admin monitoring (paginated, with media previews)
exports.getMessages = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { search, mediaType, isPaywall, from, to, sortBy, sortOrder } = req.query;

  const query = {};

  // Optional server-side sorting (defaults to newest first).
  const SORT_FIELDS = {
    date: 'createdAt'
  };
  const sortField = SORT_FIELDS[sortBy];
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = sortField ? { [sortField]: sortDir } : { createdAt: -1 };

  // Media type filter: 'image' | 'video' | 'gif' | 'media' | 'text'
  if (mediaType === 'text') {
    query.mediaType = 'none';
  } else if (mediaType && ['image', 'video', 'gif', 'media'].includes(mediaType)) {
    query.mediaType = mediaType;
  }

  // Paywall filter
  if (isPaywall === 'true') query.isPaywall = true;
  else if (isPaywall === 'false') query.isPaywall = false;

  Object.assign(query, buildDateRangeQuery(from, to));

  const searchRegex = search && search.trim()
    ? { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    : null;

  if (searchRegex) {
    const matchedUsers = await User.find({
      $or: [{ displayName: searchRegex }, { username: searchRegex }, { email: searchRegex }]
    }).select('_id').lean();
    const userIds = matchedUsers.map((u) => u._id);
    query.$or = [
      { content: searchRegex },
      { senderId: { $in: userIds } },
      { receiverId: { $in: userIds } }
    ];
  }

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate('senderId', 'username displayName avatarUrl email role')
      .populate('receiverId', 'username displayName avatarUrl email role')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Message.countDocuments(query)
  ]);

  // Presign media so the admin can preview every attachment.
  const enriched = await Promise.all(
    messages.map(async (msg) => {
      const m = msg.toObject();
      m.mediaUrl = await presignMediaUrl(m.mediaUrl);
      return m;
    })
  );

  res.status(200).json({
    status: 'success',
    results: enriched.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    messages: enriched
  });
});

// Delete message (also removes the attachment from S3)
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const msg = await Message.findById(id);
  if (!msg) {
    return next(new ApiError(404, 'Message not found'));
  }

  if (msg.mediaUrl) {
    await awsService.deleteS3Media([msg.mediaUrl]);
  }
  await Message.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Message deleted successfully'
  });
});
