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

const { initPostScheduler, initSubscriptionExpirationScheduler } = require('./utils/scheduler');

// Database Connection
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantrio';
mongoose.connect(dbUri)
  .then(() => {
    console.log('DB Connection successful! 🔌');
    initPostScheduler();
    initSubscriptionExpirationScheduler();
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
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// Socket.io Real-time connection handlers
io.on('connection', (socket) => {
  console.log(`New Socket Client Connected: ${socket.id}`);

  // Map User to Socket Room on Auth registration
  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
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
