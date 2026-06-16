const CallLog = require('../models/CallLog');
const CreatorProfile = require('../models/CreatorProfile');
const Wallet = require('../models/Wallet');
const walletService = require('../services/wallet.service');
const zegoService = require('../services/zegocloud.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

// Initiate audio or video call
exports.initiateCall = catchAsync(async (req, res, next) => {
  const { receiverId, type } = req.body;

  if (!receiverId || !['audio', 'video'].includes(type)) {
    return next(new ApiError(400, 'Please provide receiverId and valid call type (audio or video)'));
  }

  // Find creator call rates
  const creatorProfile = await CreatorProfile.findOne({ userId: receiverId });
  if (!creatorProfile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  const rate = type === 'video'
    ? (creatorProfile.rates.videoCallMinute || 50)
    : (creatorProfile.rates.voiceCallMinute || 30);

  // Validate caller has coins for at least 1 minute
  const wallet = await Wallet.findOne({ userId: req.user._id });
  if (!wallet || wallet.balanceCoins < rate) {
    return next(new ApiError(400, 'Insufficient balance. You need at least 1 minute worth of coins to call.'));
  }

  // Create unique room id
  const roomId = `room_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  // Generate Zego tokens for both parties
  const callerToken = zegoService.generateZegoToken(req.user._id, roomId);
  const receiverToken = zegoService.generateZegoToken(receiverId, roomId);

  // Log Call session
  const callLog = await CallLog.create({
    callerId: req.user._id,
    receiverId,
    roomId,
    type,
    coinRatePerMinute: rate,
    status: 'initiated'
  });

  // Notify receiver via WebSockets
  const io = req.app.get('io');
  if (io) {
    io.to(receiverId.toString()).emit('incoming_call', {
      callLogId: callLog._id,
      roomId,
      caller: {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName
      },
      type,
      rate,
      zegoToken: receiverToken
    });
  }

  res.status(200).json({
    status: 'success',
    roomId,
    zegoToken: callerToken,
    callLog
  });
});

// Accept incoming call (Creator only)
exports.acceptCall = catchAsync(async (req, res, next) => {
  const { callLogId } = req.params;

  const callLog = await CallLog.findById(callLogId);
  if (!callLog) {
    return next(new ApiError(404, 'Call session not found'));
  }

  if (callLog.receiverId.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'You are not the receiver of this call'));
  }

  callLog.status = 'active';
  await callLog.save();

  // Notify caller via WebSockets
  const io = req.app.get('io');
  if (io) {
    io.to(callLog.callerId.toString()).emit('call_accepted', {
      callLogId: callLog._id,
      roomId: callLog.roomId
    });
  }

  res.status(200).json({
    status: 'success',
    callLog
  });
});

// Reject incoming call (Creator only)
exports.rejectCall = catchAsync(async (req, res, next) => {
  const { callLogId } = req.params;

  const callLog = await CallLog.findById(callLogId);
  if (!callLog) {
    return next(new ApiError(404, 'Call session not found'));
  }

  if (callLog.receiverId.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'You are not the receiver of this call'));
  }

  callLog.status = 'rejected';
  callLog.endedAt = Date.now();
  await callLog.save();

  // Notify caller
  const io = req.app.get('io');
  if (io) {
    io.to(callLog.callerId.toString()).emit('call_rejected', {
      callLogId: callLog._id
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Call rejected'
  });
});

// End active call
exports.endCall = catchAsync(async (req, res, next) => {
  const { roomId } = req.body;

  const callLog = await CallLog.findOne({ roomId });
  if (!callLog) {
    return next(new ApiError(404, 'Call session not found'));
  }

  if (callLog.status === 'completed' || callLog.status === 'rejected') {
    return res.status(200).json({
      status: 'success',
      message: 'Call already ended',
      callLog
    });
  }

  callLog.status = callLog.status === 'initiated' ? 'missed' : 'completed';
  callLog.endedAt = Date.now();
  await callLog.save();

  // Notify other user
  const otherUserId = req.user._id.toString() === callLog.callerId.toString()
    ? callLog.receiverId.toString()
    : callLog.callerId.toString();

  const io = req.app.get('io');
  if (io) {
    io.to(otherUserId).emit('call_ended', { roomId });
  }

  res.status(200).json({
    status: 'success',
    callLog
  });
});

// Call heartbeat per-minute billing
exports.heartbeat = catchAsync(async (req, res, next) => {
  const { roomId } = req.body;

  const callLog = await CallLog.findOne({ roomId });
  if (!callLog) {
    return next(new ApiError(404, 'Call session not found'));
  }

  if (callLog.status !== 'active') {
    return next(new ApiError(400, 'Cannot process heartbeat for an inactive call session'));
  }

  const rate = callLog.coinRatePerMinute;

  // Verify caller wallet balance
  const callerWallet = await Wallet.findOne({ userId: callLog.callerId });
  if (!callerWallet || callerWallet.balanceCoins < rate) {
    // Force call termination
    callLog.status = 'completed';
    callLog.endedAt = Date.now();
    await callLog.save();

    const io = req.app.get('io');
    if (io) {
      io.to(callLog.callerId.toString()).emit('call_terminated', {
        roomId,
        reason: 'insufficient_funds'
      });
      io.to(callLog.receiverId.toString()).emit('call_terminated', {
        roomId,
        reason: 'insufficient_funds'
      });
    }

    return res.status(200).json({
      status: 'terminated',
      reason: 'insufficient_funds',
      callLog
    });
  }

  // Execute atomic per-minute transfer (20% platform share)
  await walletService.transferCoins(
    callLog.callerId,
    callLog.receiverId,
    rate,
    'call_billing',
    callLog._id
  );

  // Update call metadata logs
  callLog.totalMinutesBilling += 1;
  callLog.totalCoinsBilled += rate;
  await callLog.save();

  // Double check if caller has funds left for the NEXT minute
  const updatedWallet = await Wallet.findOne({ userId: callLog.callerId });
  let nextMinuteStatus = 'active';
  if (!updatedWallet || updatedWallet.balanceCoins < rate) {
    nextMinuteStatus = 'pending_termination_next_minute';
    const io = req.app.get('io');
    if (io) {
      // Alert users that call will disconnect if they don't recharge
      io.to(callLog.callerId.toString()).emit('call_warning', {
        message: 'Your coin balance is extremely low. Recharge now to stay connected.'
      });
    }
  }

  res.status(200).json({
    status: nextMinuteStatus,
    callLog
  });
});
