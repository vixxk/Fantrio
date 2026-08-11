const SupportTicket = require('../../models/SupportTicket');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');
const emailService = require('../../services/email.service');

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

  const ticket = await SupportTicket.findById(id).populate('userId', 'email displayName username');
  if (!ticket) {
    return next(new ApiError(404, 'Support ticket not found'));
  }

  const previousReply = (ticket.reply || '').trim();

  if (status) ticket.status = status;
  if (reply !== undefined) ticket.reply = reply;

  // Track when the admin last replied so both the admin panel and the fan's
  // ticket page can show a reply timestamp. Only count a genuinely new reply
  // (non-empty AND different from what was stored) so re-saving the same text
  // via a status-only update doesn't fire a duplicate email or reset the time.
  const trimmedReply = reply !== undefined && typeof reply === 'string' ? reply.trim() : '';
  const hasNewReply = trimmedReply !== '' && trimmedReply !== previousReply;
  if (hasNewReply) ticket.repliedAt = new Date();

  await ticket.save();

  // Notify the fan by email when their ticket gets a response. Best-effort:
  // a delivery failure must never fail the admin's request.
  if (hasNewReply && ticket.userId?.email) {
    try {
      await emailService.sendTicketReplyNotification(ticket.userId.email, {
        ticketId: ticket._id,
        subject: ticket.subject,
        reply: ticket.reply,
        status: ticket.status
      });
    } catch (err) {
      console.warn('Failed to send ticket reply email:', err.message);
    }
  }

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
