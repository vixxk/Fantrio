const CallLog = require('../../models/CallLog');
const LiveStream = require('../../models/LiveStream');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// Retrieve all calls
exports.getCalls = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const calls = await CallLog.find()
    .populate('callerId', 'username displayName')
    .populate('receiverId', 'username displayName')
    .sort({ createdAt: -1 });

  const filtered = search
    ? calls.filter((c) => {
        const q = search.toLowerCase();
        const caller = c.callerId ? `${c.callerId.displayName} ${c.callerId.username}` : '';
        const receiver = c.receiverId ? `${c.receiverId.displayName} ${c.receiverId.username}` : '';
        return (
          c.type.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q) ||
          caller.toLowerCase().includes(q) ||
          receiver.toLowerCase().includes(q)
        );
      })
    : calls;

  res.status(200).json({
    status: 'success',
    calls: filtered
  });
});

// Retrieve all live streams
exports.getLiveStreams = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const streams = await LiveStream.find()
    .populate('creatorId', 'username displayName')
    .sort({ createdAt: -1 });

  const filtered = search
    ? streams.filter((s) => {
        const q = search.toLowerCase();
        const creator = s.creatorId ? `${s.creatorId.displayName} ${s.creatorId.username} ${s.title || ''}` : '';
        return creator.toLowerCase().includes(q) || s.status.toLowerCase().includes(q);
      })
    : streams;

  res.status(200).json({
    status: 'success',
    streams: filtered
  });
});

// Terminate or delete a live stream
exports.terminateStream = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const stream = await LiveStream.findById(id);
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }

  stream.status = 'ended';
  await stream.save();

  res.status(200).json({
    status: 'success',
    message: 'Live stream terminated successfully',
    stream
  });
});
