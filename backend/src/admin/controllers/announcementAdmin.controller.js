const Announcement = require('../../models/Announcement');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all announcements
exports.getAnnouncements = catchAsync(async (req, res, next) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.status(200).json({
    status: 'success',
    announcements
  });
});

// Create new announcement
exports.createAnnouncement = catchAsync(async (req, res, next) => {
  const { title, content, category } = req.body;

  if (!title || !content) {
    return next(new ApiError(400, 'Title and content are required'));
  }

  const announcement = await Announcement.create({
    title,
    content,
    category: category || 'news'
  });

  res.status(201).json({
    status: 'success',
    announcement
  });
});

// Update announcement
exports.updateAnnouncement = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return next(new ApiError(404, 'Announcement not found'));
  }

  if (title) announcement.title = title;
  if (content) announcement.content = content;
  if (category) announcement.category = category;

  await announcement.save();

  res.status(200).json({
    status: 'success',
    announcement
  });
});

// Delete announcement
exports.deleteAnnouncement = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) {
    return next(new ApiError(404, 'Announcement not found'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Announcement successfully deleted'
  });
});
