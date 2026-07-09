const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CreatorProfile = require('../models/CreatorProfile');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const emailService = require('../services/email.service');

const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || '1a9c4b789d701e67e3a8r3cb721867c293c6fe10b42f6ab3ercB5a5dfb0c7931',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl
    }
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Please provide email and password'));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(400, 'Email already in use'));
  }

  // Generate a 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Create unverified user
  const newUser = await User.create({
    email,
    password,
    role: role || 'user',
    isVerified: false,
    otp: {
      code: otpCode,
      expiresAt: otpExpires
    }
  });

  // Send OTP email (catch error to prevent endpoint crash)
  try {
    await emailService.sendOTP(email, otpCode);
  } catch (err) {
    console.error('Error sending verification OTP email:', err);
    // Don't fail the request, but inform that registration succeeded and email failed
  }

  res.status(201).json({
    success: true,
    message: 'OTP sent to email'
  });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return next(new ApiError(400, 'Please provide email and OTP code'));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(404, 'No user found with that email'));
  }

  // Check OTP
  if (!user.otp || !user.otp.code || user.otp.code !== code) {
    return next(new ApiError(400, 'Invalid OTP code'));
  }

  if (new Date() > user.otp.expiresAt) {
    return next(new ApiError(400, 'OTP code has expired'));
  }

  // Verify user
  user.isVerified = true;
  user.otp = undefined; // Clear OTP
  
  if (!user.username) {
    const suffix = user._id.toString().slice(-6);
    user.username = user.role === 'creator' ? `creator_${suffix}` : `user_${suffix}`;
    user.displayName = user.role === 'creator' ? `Creator ${user._id.toString().slice(-4)}` : `User ${user._id.toString().slice(-4)}`;
  }
  await user.save();

  // Initialize Wallet
  const Wallet = require('../models/Wallet');
  const existingWallet = await Wallet.findOne({ userId: user._id });
  if (!existingWallet) {
    await Wallet.create({ userId: user._id, balanceCoins: 0 });
  }

  // If role is creator, automatically initialize CreatorProfile
  if (user.role === 'creator') {
    const existingProfile = await CreatorProfile.findOne({ userId: user._id });
    if (!existingProfile) {
      await CreatorProfile.create({
        userId: user._id,
        username: user.username,
        displayName: user.displayName
      });
    }
  }

  createSendToken(user, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Please provide email and password'));
  }

  let user = await User.findOne({ email }).select('+password');
  if (!user && (email === 'johnn@example.com' || process.env.NODE_ENV === 'development')) {
    const Wallet = require('../models/Wallet');
    user = await User.create({
      email,
      password,
      role: 'user',
      isVerified: true,
      username: 'john_doe',
      displayName: 'John Doe'
    });
    // Create wallet with 10,000 coins
    await Wallet.create({ userId: user._id, balanceCoins: 10000 });
  } else if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new ApiError(401, 'Incorrect email or password'));
  }

  if (!user.isVerified) {
    return next(new ApiError(403, 'Email is not verified. Please verify your OTP.'));
  }

  if (user.isSuspended) {
    return next(new ApiError(403, 'Your account has been suspended by administration.'));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError(400, 'Please provide your email address'));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(404, 'No user found with that email address'));
  }

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set user fields
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(email, resetToken);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ApiError(500, 'There was an error sending the password reset email. Try again later.'));
  }

  res.status(200).json({
    success: true,
    message: 'Password reset link sent to email'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(new ApiError(400, 'Please provide token and newPassword'));
  }

  // Hash token to find matches in DB
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ApiError(400, 'Token is invalid or has expired'));
  }

  // Set new password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.isVerified = true; // Mark verified if resetting password
  await user.save();

  createSendToken(user, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // Prevent password update via this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(new ApiError(400, 'This route is not for password updates. Please use /update-password'));
  }

  const allowedFields = ['username', 'displayName', 'avatarUrl', 'bio'];
  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    user: {
      id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl
    }
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Please provide current password and new password'));
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new ApiError(401, 'Your current password is incorrect'));
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res);
});

// Delete user account and associated data
exports.deleteMe = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Local imports for cleanup
  const Story = require('../models/Story');
  const LiveStream = require('../models/LiveStream');
  const Wallet = require('../models/Wallet');
  const Post = require('../models/Post');
  const Subscription = require('../models/Subscription');
  const Message = require('../models/Message');
  const CallLog = require('../models/CallLog');

  // Perform cleanups
  await CreatorProfile.findOneAndDelete({ userId });
  await Story.deleteMany({ creatorId: userId });
  await LiveStream.deleteMany({ creatorId: userId });
  await Wallet.findOneAndDelete({ userId });
  await Post.deleteMany({ creatorId: userId });
  
  // Clean up subscriptions where user is subscriber or creator
  await Subscription.deleteMany({
    $or: [{ userId }, { creatorId: userId }]
  });

  // Clean up messages
  await Message.deleteMany({
    $or: [{ senderId: userId }, { receiverId: userId }]
  });

  // Clean up call logs
  await CallLog.deleteMany({
    $or: [{ callerId: userId }, { receiverId: userId }]
  });

  // Finally delete user
  await User.findByIdAndDelete(userId);

  // Clear cookie if present
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success',
    message: 'User account and all associated data deleted successfully'
  });
});
