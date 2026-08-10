const mongoose = require('mongoose');
const CallLog = require('../models/CallLog');
const CreatorProfile = require('../models/CreatorProfile');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const walletService = require('../services/wallet.service');
const agoraService = require('../services/agora.service');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Find any active call the user is part of (used for "busy" checks)
const findActiveCallForUser = async (userId) =>
  CallLog.findOne({
    status: 'active',
    $or: [{ callerId: userId }, { receiverId: userId }]
  });

// Initiate audio or video call
exports.initiateCall = catchAsync(async (req, res, next) => {
  const { receiverId, type } = req.body;

  if (!receiverId || !isValidObjectId(receiverId)) {
    return next(new ApiError(400, 'Please provide a valid receiverId'));
  }
  if (!['audio', 'video'].includes(type)) {
    return next(new ApiError(400, 'Please provide valid call type (audio or video)'));
  }

  // A user cannot call themselves
  if (receiverId === req.user._id.toString()) {
    return next(new ApiError(400, 'You cannot call yourself'));
  }

  // Caller must not already be in an active call
  const callerBusy = await findActiveCallForUser(req.user._id);
  if (callerBusy) {
    return next(new ApiError(400, 'You are already in an active call. End it before starting a new one.'));
  }

  // Receiver must be a creator with a callable profile
  const creatorProfile = await CreatorProfile.findOne({ userId: receiverId });
  if (!creatorProfile) {
    return next(new ApiError(404, 'Creator profile not found'));
  }

  const availability = type === 'audio' ? creatorProfile.audioAvailable : creatorProfile.videoAvailable;
  if (!availability) {
    return next(new ApiError(400, `This creator has disabled ${type} calls`));
  }

  const rate = type === 'video'
    ? (creatorProfile.rates.videoCallPerMin || 50)
    : (creatorProfile.rates.audioCallPerMin || 30);

  // Receiver must not be in an active call (busy)
  const receiverBusy = await findActiveCallForUser(receiverId);
  if (receiverBusy) {
    return next(new ApiError(400, 'This creator is currently busy on another call'));
  }

  // Validate caller has coins for at least 1 minute
  const wallet = await Wallet.findOne({ userId: req.user._id });
  if (!wallet || wallet.balanceCoins < rate) {
    return next(new ApiError(400, 'Insufficient balance. You need at least 1 minute worth of coins to call.'));
  }

  // Create unique room id
  const roomId = `room_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  // Generate Agora tokens for both parties
  const callerToken = agoraService.generateAgoraToken(req.user._id, roomId);
  const receiverToken = agoraService.generateAgoraToken(receiverId, roomId);

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
      type,
      rate,
      caller: {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl || ''
      },
      receiverId,
      status: 'initiated',
      createdAt: callLog.createdAt,
      endedAt: callLog.endedAt,
      callerId: callLog.callerId,
      totalMinutesBilling: callLog.totalMinutesBilling,
      totalCoinsBilled: callLog.totalCoinsBilled,
      coinRatePerMinute: callLog.coinRatePerMinute,
      _id: callLog._id,
      agoraToken: receiverToken
    });
  }

  res.status(200).json({
    status: 'success',
    roomId,
    type,
    rate,
    callLogId: callLog._id,
    receiverToken,
    callLog: {
      ...callLog.toObject(),
      callerToken
    },
    createdAt: callLog.createdAt,
    endedAt: callLog.endedAt,
    callerId: callLog.callerId,
    receiverId: callLog.receiverId,
    status: callLog.status,
    totalMinutesBilling: callLog.totalMinutesBilling,
    totalCoinsBilled: callLog.totalCoinsBilled,
    coinRatePerMinute: callLog.coinRatePerMinute
  });
});

// Accept incoming call (Receiver only)
exports.acceptCall = catchAsync(async (req, res, next) => {
  const { callLogId } = req.params;

  if (!isValidObjectId(callLogId)) {
    return next(new ApiError(400, 'Invalid call session id'));
  }

  const callLog = await CallLog.findById(callLogId);
  if (!callLog) {
    return next(new ApiError(404, 'Call session not found'));
  }

  if (callLog.receiverId.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'You are not the receiver of this call'));
  }

  if (callLog.status !== 'initiated') {
    return next(new ApiError(400, 'Call is no longer waiting for acceptance'));
  }

  // A user can only be in one active call
  const busy = await findActiveCallForUser(req.user._id);
  if (busy) {
    callLog.status = 'rejected';
    callLog.endedAt = Date.now();
    await callLog.save();
    const io = req.app.get('io');
    if (io) {
      io.to(callLog.callerId.toString()).emit('call_rejected', {
        callLogId: callLog._id,
        roomId: callLog.roomId,
        reason: 'receiver_busy'
      });
    }
    return next(new ApiError(400, 'You are already in an active call'));
  }

  // Generate a fresh token for the receiver for this room
  const receiverToken = agoraService.generateAgoraToken(req.user._id, callLog.roomId);

  callLog.status = 'active';
  await callLog.save();

  // Notify caller via WebSockets
  const io = req.app.get('io');
  if (io) {
    io.to(callLog.callerId.toString()).emit('call_accepted', {
      callLogId: callLog._id,
      roomId: callLog.roomId,
      status: 'active',
      acceptedAt: callLog.updatedAt
    });
  }

  res.status(200).json({
    status: 'success',
    roomId: callLog.roomId,
    callLog: callLog.toObject(),
    receiverToken
  });
});

// Reject incoming call (Receiver only)
exports.rejectCall = catchAsync(async (req, res, next) => {
  const { callLogId } = req.params;

  if (!isValidObjectId(callLogId)) {
    return next(new ApiError(400, 'Invalid call session id'));
  }

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
      callLogId: callLog._id,
      roomId: callLog.roomId
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Call rejected'
  });
});

// End active call (either party)
exports.endCall = catchAsync(async (req, res, next) => {
  const { roomId } = req.body;

  if (!roomId) {
    return next(new ApiError(400, 'Please provide a roomId'));
  }

  const callLog = await CallLog.findOne({ roomId });
  if (!callLog) {
    return next(new ApiError(404, 'Call session not found'));
  }

  // Only caller or receiver can end the call
  if (
    callLog.callerId.toString() !== req.user._id.toString() &&
    callLog.receiverId.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError(403, 'You are not part of this call'));
  }

  if (callLog.status === 'completed' || callLog.status === 'rejected' || callLog.status === 'missed') {
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
    io.to(otherUserId).emit('call_ended', {
      roomId,
      callLogId: callLog._id,
      status: callLog.status,
      endedAt: callLog.endedAt
    });
  }

  res.status(200).json({
    status: 'success',
    callLog
  });
});

// Call heartbeat per-minute billing
exports.heartbeat = catchAsync(async (req, res, next) => {
  const { roomId } = req.body;

  if (!roomId) {
    return next(new ApiError(400, 'Please provide a roomId'));
  }

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

  // Execute atomic per-minute transfer (platform commission applied inside service)
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

// Retrieve call history for the current user
exports.getCallHistory = catchAsync(async (req, res, next) => {
  const { type, status } = req.query;

  const query = {
    $or: [
      { callerId: req.user._id },
      { receiverId: req.user._id }
    ]
  };
  if (type === 'audio' || type === 'video') query.type = type;
  if (['initiated', 'active', 'completed', 'missed', 'rejected'].includes(status)) query.status = status;

  const calls = await CallLog.find(query)
    .populate('callerId', 'username displayName avatarUrl')
    .populate('receiverId', 'username displayName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    status: 'success',
    calls
  });
});

// List creators available for audio/video calls (with filters + pagination)
exports.getCallableCreators = catchAsync(async (req, res, next) => {
  const type = req.query.type === 'video' ? 'video' : 'audio';
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const { search, category, language, country, availability } = req.query;

  const filter = { verificationStatus: 'approved' };
  if (type === 'audio') filter.audioAvailable = true;
  else filter.videoAvailable = true;

  if (availability === 'online') {
    filter.isOnline = true;
    filter.showOnlineStatus = { $ne: false };
  }

  const searchRegex = search && search.trim()
    ? { $regex: escapeRegExp(search.trim()), $options: 'i' }
    : null;

  if (searchRegex) {
    filter.$or = [
      { displayName: searchRegex },
      { username: searchRegex }
    ];
  }
  if (category && category !== 'All Categories') filter.categories = category;
  if (language && language !== 'All Languages') filter.language = language;
  if (country && country !== 'All Countries') filter.country = country;

  const [profiles, total] = await Promise.all([
    CreatorProfile.find(filter)
      .sort({ rating: -1, followerCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CreatorProfile.countDocuments(filter)
  ]);

  // Determine busy creators (in an active call right now)
  const profileUserIds = profiles.map((p) => p.userId);
  const activeCalls = profileUserIds.length
    ? await CallLog.find({
        status: 'active',
        $or: [{ callerId: { $in: profileUserIds } }, { receiverId: { $in: profileUserIds } }]
      }).select('callerId receiverId').lean()
    : [];
  const busyIds = new Set();
  activeCalls.forEach((c) => {
    busyIds.add(c.callerId.toString());
    busyIds.add(c.receiverId.toString());
  });

  const creators = profiles.map((p) => ({
    _id: p._id,
    userId: p.userId,
    displayName: p.displayName || p.username,
    username: p.username,
    avatarUrl: p.avatarUrl,
    coverUrl: p.coverBannerUrl,
    isVerifiedBadge: p.isVerifiedBadge,
    isOnline: p.showOnlineStatus !== false && !!p.isOnline,
    isBusy: busyIds.has(p.userId.toString()),
    rating: p.rating,
    ratingCount: p.ratingCount,
    // Must stay in sync with the fallbacks used in initiateCall so the rate
    // shown to the listener matches what is actually charged per minute.
    rate: type === 'video' ? (p.rates.videoCallPerMin || 50) : (p.rates.audioCallPerMin || 30),
    isTopRated: (p.rating || 0) >= 4.8 && (p.ratingCount || 0) >= 100,
    category: p.categories && p.categories[0] ? p.categories[0] : '',
    categories: p.categories,
    language: p.language,
    country: p.country,
    followerCount: p.followerCount,
    contentType: p.contentType
  }));

  res.status(200).json({
    status: 'success',
    creators,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    type
  });
});
