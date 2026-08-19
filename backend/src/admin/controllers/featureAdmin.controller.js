const FeatureRequest = require('../../models/FeatureRequest');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all feature requests
exports.getFeatures = catchAsync(async (req, res, next) => {
  const User = require('../../models/User');
  const { search } = req.query;
  const query = {};

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchedUsers = await User.find({
      $or: [{ displayName: searchRegex }, { username: searchRegex }, { email: searchRegex }]
    }).select('_id').lean();
    const userIds = matchedUsers.map((u) => u._id);

    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { status: searchRegex },
      { userId: { $in: userIds } }
    ];
  }

  const features = await FeatureRequest.find(query)
    .populate('userId', 'username displayName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    features
  });
});

// Update feature status
exports.updateFeature = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, isApproved } = req.body;

  const feature = await FeatureRequest.findById(id);
  if (!feature) {
    return next(new ApiError(404, 'Feature request not found'));
  }

  if (status) feature.status = status;
  if (typeof isApproved === 'boolean') feature.isApproved = isApproved;

  await feature.save();

  res.status(200).json({
    status: 'success',
    feature
  });
});

// Delete feature request
exports.deleteFeature = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const feature = await FeatureRequest.findByIdAndDelete(id);
  if (!feature) {
    return next(new ApiError(404, 'Feature request not found'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Feature request successfully deleted'
  });
});
