const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get token and check if it exists
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    token = cookies.token;
  }

  if (!token) {
    return next(new ApiError(401, 'You are not logged in! Please log in to get access.'));
  }

  // 2) Verification of token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || '1a9c4b789d701e67e3a8r3cb721867c293c6fe10b42f6ab3ercB5a5dfb0c7931');
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token. Please log in again.'));
  }

  // 3) Check if user still exists
  // Handle hardcoded admin
  if (decoded.id === 'admin-hardcoded') {
    const adminUser = {
      _id: 'admin-hardcoded',
      email: process.env.ADMIN_EMAIL,
      role: 'admin',
      isVerified: true,
      isSuspended: false,
      username: process.env.ADMIN_USERNAME || 'admin',
      displayName: 'Administrator',
      avatarUrl: ''
    };
    req.user = adminUser;
    return next();
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new ApiError(401, 'The user belonging to this token no longer exists.'));
  }

  if (currentUser.isSuspended) {
    return next(new ApiError(403, 'Your account is suspended.'));
  }

  // Grant access
  req.user = currentUser;
  next();
});

// Optional authentication: attaches req.user when a valid token is provided,
// but never fails the request. Used by public endpoints that only need to
// personalise the response for logged-in visitors (e.g. discovery feeds).
const protectOptional = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    token = cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || '1a9c4b789d701e67e3a8r3cb721867c293c6fe10b42f6ab3ercB5a5dfb0c7931');
  } catch (err) {
    req.user = null;
    return next();
  }

  // Handle hardcoded admin
  if (decoded.id === 'admin-hardcoded') {
    req.user = {
      _id: 'admin-hardcoded',
      email: process.env.ADMIN_EMAIL,
      role: 'admin',
      isVerified: true,
      isSuspended: false,
      username: process.env.ADMIN_USERNAME || 'admin',
      displayName: 'Administrator',
      avatarUrl: ''
    };
    return next();
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser || currentUser.isSuspended) {
    req.user = null;
    return next();
  }

  req.user = currentUser;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
};

module.exports = {
  protect,
  protectOptional,
  restrictTo
};
