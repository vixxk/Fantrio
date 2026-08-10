const SupportTicket = require('../../models/SupportTicket');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');

// Retrieve all support tickets
exports.getTickets = catchAsync(async (req, res, next) => {
  const { search, status, from, to } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }
  // Status filter matching the SupportTicket schema enum
  if (status && ['open', 'in-progress', 'closed'].includes(status)) {
    query.status = status;
  }
  Object.assign(query, buildDateRangeQuery(from, to));

  const tickets = await SupportTicket.find(query)
    .populate('userId', 'username displayName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    tickets
  });
});

// Update support ticket details (status and reply text)
exports.updateTicket = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, reply } = req.body;

  const ticket = await SupportTicket.findById(id);
  if (!ticket) {
    return next(new ApiError(404, 'Support ticket not found'));
  }

  if (status) ticket.status = status;
  if (reply !== undefined) ticket.reply = reply;

  await ticket.save();

  res.status(200).json({
    status: 'success',
    ticket
  });
});

// Delete a support ticket
exports.deleteTicket = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const ticket = await SupportTicket.findByIdAndDelete(id);
  if (!ticket) {
    return next(new ApiError(404, 'Support ticket not found'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Support ticket successfully deleted'
  });
});
