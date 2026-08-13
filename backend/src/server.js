const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = require('./app');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const { initPostScheduler, initSubscriptionExpirationScheduler, initStoryExpirationScheduler, initLiveStreamScheduler } = require('./utils/scheduler');
const seedMoreData = require('./utils/moreSeed');

// Database Connection
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantrio';
mongoose.connect(dbUri)
  .then(async () => {
    console.log('DB Connection successful! 🔌');
    // Clear stale presence from the previous process before clients reconnect.
    await resetPresenceOnBoot();
    initPostScheduler();
    initSubscriptionExpirationScheduler();
    initStoryExpirationScheduler();
    initLiveStreamScheduler();
    seedMoreData();
  })
  .catch(err => {
    console.error('DB Connection error:', err);
    process.exit(1);
  });

// Server Initialization
const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Integrate Socket.io
const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// ============================================================================
// Socket-based presence — keeps User.isOnline / CreatorProfile.isOnline in
// sync with real-time connections so fan & creator online status is accurate
// everywhere (chat conversations, subscriber filters, call availability).
// ============================================================================
const User = require('./models/User');
const CreatorProfile = require('./models/CreatorProfile');

// socket.id -> userId, plus a per-user count of open sockets (multiple tabs).
const socketUserMap = new Map();
const userSocketCount = new Map();
const onlineUsers = new Set();
// Map to track pending 5-minute disconnect timers for creators
const pendingOfflineTimers = new Map();
const CREATOR_OFFLINE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Serializes presence writes per user so a rapid connect→disconnect can never
// resolve out of order and leave a stale flag (the call guard trusts this).
const presenceQueue = new Map();

// Only write to the DB on actual presence transitions to avoid write churn.
// `lastSeenAt` records the last time the user went ONLINE; going offline
// leaves the timestamp untouched.
const updatePresence = (userId, online) => {
  const prev = presenceQueue.get(userId) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(async () => {
      const set = { isOnline: online };
      if (online) set.lastSeenAt = new Date();
      await Promise.all([
        User.updateOne({ _id: userId }, { $set: set }),
        // Mirror onto the creator profile when the user is a creator so the call
        // availability guard, discover filters and profile pages agree.
        CreatorProfile.updateOne({ userId }, { $set: { isOnline: online } })
      ]);
      // Broadcast real-time presence change to all connected socket clients
      io.emit('user_presence_change', { userId: String(userId), isOnline: online });
    })
    .catch((err) => console.error(`[Presence] Failed to set presence for ${userId} -> ${online}:`, err));
  presenceQueue.set(userId, next);
  return next;
};

// Presence state is in-memory, so any "online" flags left over from a previous
// process run must be cleared on boot — otherwise an offline user/creator stays
// "online" (and callable) until they happen to reconnect.
const resetPresenceOnBoot = async () => {
  try {
    await Promise.all([
      User.updateMany({ isOnline: true }, { $set: { isOnline: false } }),
      CreatorProfile.updateMany({ isOnline: true }, { $set: { isOnline: false } })
    ]);
    console.log('[Presence] Reset presence flags on boot.');
  } catch (err) {
    console.error('[Presence] Failed to reset presence flags on boot:', err);
  }
};

const markUserOfflineIfNoSockets = async (userId) => {
  const count = userSocketCount.get(userId) || 0;
  if (count > 0) return; // still connected from another tab

  try {
    const user = await User.findById(userId).select('role').lean();
    const isCreator = user && user.role === 'creator';

    if (isCreator) {
      // Creator disconnect: keep isOnline: true for 5 minutes before setting offline
      if (!pendingOfflineTimers.has(userId)) {
        console.log(`[Presence] Creator ${userId} disconnected. 5-minute offline grace period initiated.`);
        const timer = setTimeout(async () => {
          pendingOfflineTimers.delete(userId);
          const currentCount = userSocketCount.get(userId) || 0;
          if (currentCount === 0 && onlineUsers.has(userId)) {
            userSocketCount.delete(userId);
            onlineUsers.delete(userId);
            await updatePresence(userId, false);
            console.log(`[Presence] Creator ${userId} 5-minute grace period expired. Marked offline.`);
          }
        }, CREATOR_OFFLINE_TIMEOUT_MS);
        pendingOfflineTimers.set(userId, timer);
      }
    } else {
      // Non-creator (fan): mark offline immediately
      if (pendingOfflineTimers.has(userId)) {
        clearTimeout(pendingOfflineTimers.get(userId));
        pendingOfflineTimers.delete(userId);
      }
      userSocketCount.delete(userId);
      if (onlineUsers.has(userId)) {
        onlineUsers.delete(userId);
        await updatePresence(userId, false);
      }
    }
  } catch (err) {
    console.error(`[Presence] Error in markUserOfflineIfNoSockets for ${userId}:`, err);
    userSocketCount.delete(userId);
    if (onlineUsers.has(userId)) {
      onlineUsers.delete(userId);
      await updatePresence(userId, false);
    }
  }
};

// Socket.io Real-time connection handlers
io.on('connection', (socket) => {
  console.log(`New Socket Client Connected: ${socket.id}`);

  // Map User to Socket Room on Auth registration (doubles as the presence hook)
  socket.on('join_room', (userId) => {
    if (!userId) return;
    const uid = String(userId);
    socket.join(uid);

    // Ignore repeated emits from the same socket (Header + chat page both join).
    if (socketUserMap.get(socket.id) === uid) return;

    // A socket switching users (logout/login without refresh) releases the old one.
    const prev = socketUserMap.get(socket.id);
    if (prev) {
      userSocketCount.set(prev, Math.max(0, (userSocketCount.get(prev) || 1) - 1));
      markUserOfflineIfNoSockets(prev);
    }

    socketUserMap.set(socket.id, uid);
    userSocketCount.set(uid, (userSocketCount.get(uid) || 0) + 1);

    // Cancel any pending 5-minute offline timer if creator reconnected
    if (pendingOfflineTimers.has(uid)) {
      clearTimeout(pendingOfflineTimers.get(uid));
      pendingOfflineTimers.delete(uid);
      console.log(`[Presence] User/Creator ${uid} reconnected. Cancelled 5-minute offline timer.`);
    }

    if (!onlineUsers.has(uid)) {
      onlineUsers.add(uid);
      updatePresence(uid, true);
    }
    console.log(`User ${uid} joined room ${uid}`);
  });

  // Join a live stream room to receive real-time viewer count updates
  socket.on('join_stream_room', (streamId) => {
    if (!streamId) return;
    socket.join(`live_stream_${streamId}`);
  });

  // Leave a live stream room (stops receiving viewer count updates)
  socket.on('leave_stream_room', (streamId) => {
    if (!streamId) return;
    socket.leave(`live_stream_${streamId}`);
  });

  socket.on('disconnect', () => {
    const userId = socketUserMap.get(socket.id);
    socketUserMap.delete(socket.id);
    if (!userId) return;
    userSocketCount.set(userId, Math.max(0, (userSocketCount.get(userId) || 1) - 1));
    markUserOfflineIfNoSockets(userId);
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Start listening
const serverInstance = server.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}... 🚀`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  serverInstance.close(() => {
    process.exit(1);
  });
});
