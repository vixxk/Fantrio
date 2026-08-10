const Report = require('../../models/Report');
const User = require('../../models/User');
const Post = require('../../models/Post');
const CreatorProfile = require('../../models/CreatorProfile');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all user/submitted reports with the reported target resolved
exports.getReports = catchAsync(async (req, res, next) => {
  const { search, status } = req.query;

  const query = {};
  if (status && ['pending', 'reviewed', 'resolved'].includes(status)) {
    query.status = status;
  }

  const reports = await Report.find(query)
    .populate('reporterId', 'username displayName email avatarUrl')
    .sort({ createdAt: -1 });

  // Resolve reported targets (creator users or posts) in a single round-trip each
  const creatorTargetIds = reports.filter((r) => r.targetType === 'creator').map((r) => r.targetId);
  const postTargetIds = reports.filter((r) => r.targetType === 'content').map((r) => r.targetId);

  const [creators, posts] = await Promise.all([
    creatorTargetIds.length ? User.find({ _id: { $in: creatorTargetIds } }).select('username displayName email avatarUrl') : [],
    postTargetIds.length ? Post.find({ _id: { $in: postTargetIds } }).select('content creatorId postType') : []
  ]);

  const creatorMap = new Map(creators.map((c) => [c._id.toString(), c]));
  const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
  const creatorProfiles = await CreatorProfile.find({
    userId: { $in: [...creatorMap.keys()] }
  }).select('userId username displayName avatarUrl');

  const creatorProfileMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]));

  let data = reports.map((r) => {
    const doc = r.toObject();
    if (r.targetType === 'creator') {
      const creator = creatorMap.get(r.targetId.toString());
      doc.target = creator
        ? {
            _id: creator._id,
            username: creator.username,
            displayName: creator.displayName,
            avatarUrl: creator.avatarUrl || ''
          }
        : null;
    } else {
      const post = postMap.get(r.targetId.toString());
      if (post) {
        const prof = creatorProfileMap.get(post.creatorId.toString());
        doc.target = {
          _id: post._id,
          content: post.content,
          postType: post.postType,
          creatorDisplayName: prof ? prof.displayName : 'Creator'
        };
      } else {
        doc.target = null;
      }
    }
    return doc;
  });

  if (search) {
    const q = search.toLowerCase();
    data = data.filter(
      (r) =>
        (r.reporterId && String(r.reporterId.displayName || '').toLowerCase().includes(q)) ||
        (r.target && String(r.target.displayName || r.target.content || '').toLowerCase().includes(q)) ||
        String(r.reason || '').toLowerCase().includes(q)
    );
  }

  res.status(200).json({
    status: 'success',
    reports: data,
    total: data.length
  });
});

// Update report moderation status
exports.updateReportStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'reviewed', 'resolved'].includes(status)) {
    return next(new ApiError(400, "Please provide a valid status: 'pending', 'reviewed' or 'resolved'"));
  }

  const report = await Report.findById(id);
  if (!report) {
    return next(new ApiError(404, 'Report not found'));
  }

  report.status = status;
  await report.save();

  res.status(200).json({
    status: 'success',
    report
  });
});

// Delete a report
exports.deleteReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const report = await Report.findByIdAndDelete(id);
  if (!report) {
    return next(new ApiError(404, 'Report not found'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Report successfully deleted'
  });
});
