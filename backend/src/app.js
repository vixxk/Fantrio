const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS with dynamic client origin routing
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});
app.use('/api', limiter);

// Base health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Fantrio API Server is healthy and running'
  });
});

// Dynamic Route Registrations (Phase-wise mount points)
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/creators', require('./routes/creator.routes'));
app.use('/api/v1/posts', require('./routes/feed.routes'));
app.use('/api/v1/wallet', require('./routes/wallet.routes'));
app.use('/api/v1/monetization', require('./routes/monetization.routes'));
app.use('/api/v1/chat', require('./routes/chat.routes'));
app.use('/api/v1/calls', require('./routes/call.routes'));
// app.use('/api/v1/verification', require('./routes/verification.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));

// Global 404 Route handler
app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  err.status = 'fail';
  next(err);
});

// Global Express Error Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  res.status(statusCode).json({
    status: status,
    error: err,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
