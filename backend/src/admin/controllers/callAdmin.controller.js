const CallLog = require('../../models/CallLog');
const User = require('../../models/User');
const LiveStream = require('../../models/LiveStream');
const LiveChatMessage = require('../../models/LiveChatMessage');
const awsService = require('../../services/aws.service');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');
const { buildDateRangeQuery } = require('../../utils/dateRange');

// Retrieve all calls with pagination + filters
exports.getCalls = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { search, type, status, from, to, sortBy, sortOrder } = req.query;

  const query = {};
  if (type === 'audio' || type === 'video') query.type = type;
  if (['initiated', 'active', 'completed', 'missed', 'rejected'].includes(status)) query.status = status;

  // Period filter on the call date
  Object.assign(query, buildDateRangeQuery(from, to));

  // Optional server-side sorting (defaults to newest first).
  const SORT_FIELDS = {
    duration: 'totalMinutesBilling',
    rate: 'coinRatePerMinute',
    coins: 'totalCoinsBilled',
    date: 'createdAt'
  };
  const sortField = SORT_FIELDS[sortBy];
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  const sort = sortField ? { [sortField]: sortDir } : { createdAt: -1 };

  const searchRegex = search && search.trim()
    ? { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    : null;

  if (searchRegex) {
    const matchedUsers = await User.find({
      $or: [{ displayName: searchRegex }, { username: searchRegex }, { email: searchRegex }]
    }).select('_id').lean();
    const userIds = matchedUsers.map((u) => u._id);
    query.$or = [
      { callerId: { $in: userIds } },
      { receiverId: { $in: userIds } },
      { type: searchRegex },
      { status: searchRegex }
    ];
  }

  const [calls, total] = await Promise.all([
    CallLog.find(query)
      .populate('callerId', 'username displayName email role avatarUrl')
      .populate('receiverId', 'username displayName email role avatarUrl')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    CallLog.countDocuments(query)
  ]);

  // Attach gift totals per call: gifts sent during a call are logged with the
  // call's roomId in `metadata.callRoomId` (see monetization.sendGift).
  const roomIds = calls.map((c) => c.roomId).filter(Boolean);
  let giftsByRoom = {};
  if (roomIds.length) {
    const giftTxs = await require('../../models/Transaction').find({
      type: 'gift',
      status: 'completed',
      'metadata.callRoomId': { $in: roomIds }
    }).select('amountCoins metadata').lean();
    giftsByRoom = giftTxs.reduce((acc, g) => {
      const room = g.metadata && g.metadata.callRoomId;
      if (!room) return acc;
      acc[room] = acc[room] || { count: 0, totalCoins: 0 };
      acc[room].count += 1;
      acc[room].totalCoins += Number(g.amountCoins) || 0;
      return acc;
    }, {});
  }

  const enriched = calls.map((c) => ({
    ...c.toObject(),
    gifts: giftsByRoom[c.roomId] || { count: 0, totalCoins: 0 }
  }));

  res.status(200).json({
    status: 'success',
    results: enriched.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    calls: enriched
  });
});

// Retrieve all live streams (paginated, with search + status filters)
exports.getLiveStreams = catchAsync(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { search, status, from, to } = req.query; // status: 'live' | 'scheduled' | 'ended' | 'cancelled' | all

  const query = {};
  const validStatuses = ['live', 'scheduled', 'ended', 'cancelled'];
  if (validStatuses.includes(status)) {
    if (status === 'live') query.isLive = true;
    else query.status = status;
  }

  // Period filter on the stream creation date
  Object.assign(query, buildDateRangeQuery(from, to));

  const searchRegex = search && search.trim()
    ? { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    : null;

  if (searchRegex) {
    const matchedUsers = await User.find({
      $or: [{ displayName: searchRegex }, { username: searchRegex }, { email: searchRegex }]
    }).select('_id').lean();
    const userIds = matchedUsers.map((u) => u._id);
    query.$or = [
      { streamTitle: searchRegex },
      { category: searchRegex },
      { language: searchRegex },
      { roomId: searchRegex },
      { creatorId: { $in: userIds } }
    ];
  }

  const [streams, total] = await Promise.all([
    LiveStream.find(query)
      .populate('creatorId', 'username displayName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    LiveStream.countDocuments(query)
  ]);

  // Shape for both the current admin frontend (title/roomId/status/viewers)
  // and the richer data model (streamTitle/roomId/isLive/...).
  const shaped = streams.map((s) => {
    const isLive = !!s.isLive;
    return {
      _id: s._id,
      creatorId: s.creatorId,
      title: s.streamTitle,
      streamTitle: s.streamTitle,
      coverUrl: s.coverUrl || '',
      roomId: s.roomId,
      category: s.category,
      language: s.language,
      isLive,
      status: isLive ? 'live' : (s.status || 'ended'),
      viewers: s.viewers || [],
      viewerCount: s.viewerCount || 0,
      peakViewers: s.peakViewers || 0,
      totalViews: s.totalViews || 0,
      entryPriceCoins: s.entryPriceCoins || 0,
      freeForSubscribers: !!s.freeForSubscribers,
      scheduledAt: s.scheduledAt,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      createdAt: s.createdAt
    };
  });

  res.status(200).json({
    status: 'success',
    streams: shaped,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  });
});

// Live stream platform stats (admin overview)
exports.getLiveStreamStats = catchAsync(async (req, res, next) => {
  const [liveCount, scheduledCount, endedCount, cancelledCount, totalViewers, totalViews, entryRevenue] =
    await Promise.all([
      LiveStream.countDocuments({ isLive: true }),
      LiveStream.countDocuments({ status: 'scheduled', scheduledAt: { $gt: new Date() } }),
      LiveStream.countDocuments({ status: 'ended' }),
      LiveStream.countDocuments({ status: 'cancelled' }),
      LiveStream.aggregate([
        { $group: { _id: null, total: { $sum: '$viewerCount' } } }
      ]),
      LiveStream.aggregate([
        { $group: { _id: null, total: { $sum: '$totalViews' } } }
      ]),
      require('../../models/Transaction').aggregate([
        { $match: { type: 'live_entry', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amountCoins' } } }
      ])
    ]);

  res.status(200).json({
    status: 'success',
    stats: {
      live: liveCount,
      scheduled: scheduledCount,
      ended: endedCount,
      cancelled: cancelledCount,
      currentViewers: totalViewers[0] ? totalViewers[0].total : 0,
      totalViews: totalViews[0] ? totalViews[0].total : 0,
      entryRevenueCoins: entryRevenue[0] ? entryRevenue[0].total : 0
    }
  });
});

// Hard-delete a stream (moderation)
exports.deleteStream = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const stream = await LiveStream.findById(id);
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }

  const wasLive = !!stream.isLive;
  // Remove the uploaded cover thumbnail from cloud storage (seeded/external covers are skipped).
  await awsService.deleteS3Media([stream.coverUrl]);
  await LiveStream.findByIdAndDelete(id);
  // Remove the stream's chat history along with it.
  await LiveChatMessage.deleteMany({ streamId: id });

  // If an active stream was removed, clear the creator's live flag if no other stream is live
  if (wasLive) {
    const CreatorProfile = require('../../models/CreatorProfile');
    const stillLive = await LiveStream.exists({ creatorId: stream.creatorId, isLive: true });
    if (!stillLive) {
      await CreatorProfile.updateOne(
        { userId: stream.creatorId },
        { $set: { isLive: false } }
      );
    }
    const io = req.app.get('io');
    if (io) {
      io.to(stream.creatorId.toString()).emit('stream_terminated', {
        streamId: stream._id,
        message: 'Your live stream was removed by an administrator.'
      });
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Live stream deleted successfully'
  });
});

// Terminate or delete a live stream
exports.terminateStream = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const stream = await LiveStream.findById(id);
  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }

  if (!stream.isLive) {
    return res.status(200).json({
      status: 'success',
      message: 'Live stream is already ended',
      stream
    });
  }

  stream.isLive = false;
  stream.endedAt = Date.now();
  await stream.save();

  // Reflect the ended status on the creator's profile
  const CreatorProfile = require('../../models/CreatorProfile');
  await CreatorProfile.updateOne(
    { userId: stream.creatorId },
    { $set: { isLive: false } }
  );

  // Notify the stream creator via WebSockets if present
  const io = req.app.get('io');
  if (io) {
    io.to(stream.creatorId.toString()).emit('stream_terminated', {
      streamId: stream._id,
      message: 'Your live stream was terminated by an administrator.'
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Live stream terminated successfully',
    stream
  });
});

// Detailed admin stream analytics: tipping/gift logs, gifts leaderboard, viewers list
exports.getStreamDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const stream = await LiveStream.findById(id)
    .populate('creatorId', 'username displayName avatarUrl isVerifiedBadge')
    .populate('viewers', 'username displayName avatarUrl isVerifiedBadge')
    .populate('allViewers', 'username displayName avatarUrl isVerifiedBadge');

  if (!stream) {
    return next(new ApiError(404, 'Live stream not found'));
  }

  const Transaction = require('../../models/Transaction');

  const transactions = await Transaction.find({
    referenceId: id,
    status: 'completed'
  })
    .populate('senderId', 'displayName username avatarUrl isVerifiedBadge')
    .sort({ createdAt: -1 })
    .lean();

  // Filter for gifts sent during stream (excluding entry fees)
  const giftTransactions = transactions.filter((t) => t.type === 'gift');

  const tippingLogs = giftTransactions.map((t) => {
    const meta = t.metadata || {};
    return {
      _id: t._id,
      type: 'gift',
      amountCoins: t.amountCoins || 0,
      giftName: meta.giftName || 'Gift',
      giftEmoji: meta.giftEmoji || '🎁',
      giftCoins: meta.giftCoins || t.amountCoins || 0,
      giftTier: meta.giftTier || 1,
      sender: t.senderId
        ? {
            id: t.senderId._id,
            displayName: t.senderId.displayName || t.senderId.username || 'Fan',
            username: t.senderId.username,
            avatarUrl: t.senderId.avatarUrl || ''
          }
        : { displayName: 'Anonymous', avatarUrl: '' },
      createdAt: t.createdAt
    };
  });

  const giftsMap = new Map();
  giftTransactions.forEach((t) => {
    if (!t.senderId) return;
    const senderId = String(t.senderId._id);
    const existing = giftsMap.get(senderId) || {
      userId: senderId,
      displayName: t.senderId.displayName || t.senderId.username || 'Fan',
      username: t.senderId.username || '',
      avatarUrl: t.senderId.avatarUrl || '',
      totalCoins: 0,
      giftCount: 0
    };
    existing.totalCoins += Number(t.amountCoins) || 0;
    existing.giftCount += 1;
    giftsMap.set(senderId, existing);
  });

  const giftsLeaderboard = [...giftsMap.values()].sort((a, b) => b.totalCoins - a.totalCoins);
  const totalEarningsCoins = transactions.reduce((acc, t) => acc + (Number(t.amountCoins) || 0), 0);

  const rawViewers = (stream.allViewers && stream.allViewers.length > 0) ? stream.allViewers : (stream.viewers || []);
  const viewersList = rawViewers.map((v) => ({
    userId: v._id || v,
    displayName: v.displayName || v.username || 'Viewer',
    username: v.username || '',
    avatarUrl: v.avatarUrl || ''
  }));

  let durationStr = '0m';
  if (stream.startedAt) {
    const end = stream.endedAt ? new Date(stream.endedAt) : new Date();
    const mins = Math.max(0, Math.round((end - new Date(stream.startedAt)) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  res.status(200).json({
    status: 'success',
    streamDetails: {
      stream: {
        _id: stream._id,
        streamTitle: stream.streamTitle,
        category: stream.category,
        language: stream.language,
        status: stream.status,
        isLive: stream.isLive,
        roomId: stream.roomId,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        scheduledAt: stream.scheduledAt,
        duration: durationStr,
        viewerCount: stream.viewerCount || 0,
        peakViewers: stream.peakViewers || 0,
        totalViews: stream.totalViews || 0,
        entryPriceCoins: stream.entryPriceCoins || 0,
        totalEarningsCoins,
        creator: stream.creatorId
      },
      tippingLogs,
      giftsLeaderboard,
      viewersList
    }
  });
});

