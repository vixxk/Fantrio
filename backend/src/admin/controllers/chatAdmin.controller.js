const Message = require('../../models/Message');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all messages for admin monitoring
exports.getMessages = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const query = {};
  if (search) query.content = { $regex: search, $options: 'i' };

  const messages = await Message.find(query)
    .populate('senderId', 'username displayName')
    .populate('receiverId', 'username displayName')
    .sort({ createdAt: -1 })
    .limit(200);

  res.status(200).json({
    status: 'success',
    messages
  });
});

// Delete message
exports.deleteMessage = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const msg = await Message.findByIdAndDelete(id);
  if (!msg) {
    return next(new ApiError(404, 'Message not found'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Message deleted successfully'
  });
});
