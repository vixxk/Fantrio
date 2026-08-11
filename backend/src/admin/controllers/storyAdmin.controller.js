const Story = require('../../models/Story');
const CreatorProfile = require('../../models/CreatorProfile');
const awsService = require('../../services/aws.service');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all stories (including expired) with creator info
exports.getStories = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const { status } = req.query; // 'active' | 'expired' | all

  const query = {};
  if (status === 'active') {
    query.expiresAt = { $gt: new Date() };
  } else if (status === 'expired') {
    query.expiresAt = { $lte: new Date() };
  }

  const stories = await Story.find(query)
    .populate('creatorId', 'username displayName avatarUrl email role')
    .sort({ createdAt: -1 });

  const creatorIds = [...new Set(stories.map((s) => s.creatorId._id.toString()))];
  const profiles = creatorIds.length > 0
    ? await CreatorProfile.find({ userId: { $in: creatorIds } })
    : [];
  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.userId.toString()] = p;
  });

  let filtered = stories.map((story) => {
    const profile = profileMap[story.creatorId._id.toString()];
    return {
      _id: story._id,
      creatorId: {
        _id: story.creatorId._id,
        username: story.creatorId.username,
        displayName: story.creatorId.displayName,
        email: story.creatorId.email
      },
      username: profile ? profile.username : story.creatorId.username,
      displayName: profile ? profile.displayName : story.creatorId.displayName,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      viewsCount: story.views.length,
      isActive: story.expiresAt > new Date(),
      expiresAt: story.expiresAt,
      createdAt: story.createdAt
    };
  });

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((s) => {
      const creator = `${s.creatorId.displayName} ${s.creatorId.username} ${s.creatorId.email}`.toLowerCase();
      return creator.includes(q) || s.mediaType.toLowerCase().includes(q);
    });
  }

  res.status(200).json({
    status: 'success',
    stories: filtered
  });
});

// Delete a story (admin only) — also removes the uploaded media from cloud storage so
// moderated/expired stories don't leave orphaned files behind.
exports.deleteStory = catchAsync(async (req, res, next) => {
  const { storyId } = req.params;

  const story = await Story.findById(storyId);
  if (!story) {
    return next(new ApiError(404, 'Story not found'));
  }

  await awsService.deleteS3Media([story.mediaUrl]);
  await Story.findByIdAndDelete(storyId);

  res.status(200).json({
    status: 'success',
    message: 'Story successfully deleted'
  });
});
