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
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const buildLoginActivity = (req) => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  let device = 'Unknown device';

  if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
    device = /android/i.test(userAgent) ? 'Android Device' : 'Mobile Device';
  } else if (/windows/i.test(userAgent)) {
    device = 'Windows Computer';
  } else if (/macintosh|mac os/i.test(userAgent)) {
    device = 'Apple Computer';
  } else if (/linux/i.test(userAgent)) {
    device = 'Linux Computer';
  }

  return {
    device,
    ip: req.ip || req.socket?.remoteAddress || '',
    location: '—',
    loggedInAt: new Date()
  };
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
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

const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');

const applyReferralCode = async (user, referralCodeInput) => {
  if (!referralCodeInput) return;
  const cleanCode = String(referralCodeInput).trim().toUpperCase();
  if (!cleanCode) return;

  // Prevent claiming own code
  if (user.referralCode === cleanCode || (user.username && user.username.toUpperCase() === cleanCode)) {
    return;
  }

  // Find referrer by referralCode (or username fallback)
  let referrer = await User.findOne({ referralCode: cleanCode });
  if (!referrer) {
    referrer = await User.findOne({ username: cleanCode.toLowerCase() });
  }
  if (!referrer || referrer._id.toString() === user._id.toString()) {
    return;
  }

  // Check if already claimed
  const existingReferral = await Referral.findOne({ referredId: user._id });
  if (existingReferral) return;

  // Create referral record
  await Referral.create({
    referrerId: referrer._id,
    referredId: user._id,
    rewardGranted: true
  });

  // Credit referrer: 100 coins
  const Wallet = require('../models/Wallet');
  let referrerWallet = await Wallet.findOne({ userId: referrer._id });
  if (!referrerWallet) {
    referrerWallet = await Wallet.create({ userId: referrer._id, balanceCoins: 0 });
  }
  referrerWallet.balanceCoins = Number((referrerWallet.balanceCoins + 100).toFixed(2));
  await referrerWallet.save();

  await Transaction.create({
    senderId: null,
    receiverId: referrer._id,
    type: 'deposit',
    status: 'completed',
    amountCoins: 100,
    gateway: 'referral_bonus'
  });

  // Credit new user: 50 coins
  let userWallet = await Wallet.findOne({ userId: user._id });
  if (!userWallet) {
    userWallet = await Wallet.create({ userId: user._id, balanceCoins: 50 });
  } else {
    userWallet.balanceCoins = Number((userWallet.balanceCoins + 50).toFixed(2));
    await userWallet.save();
  }

  await Transaction.create({
    senderId: null,
    receiverId: user._id,
    type: 'deposit',
    status: 'completed',
    amountCoins: 50,
    gateway: 'referral_bonus'
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { email, password, role, username, displayName, referralCode } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Please provide email and password'));
  }

  if (password.length < 8) {
    return next(new ApiError(400, 'Password must be at least 8 characters long'));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(400, 'Email already in use'));
  }

  // Check username uniqueness if provided
  if (username) {
    const cleanUsername = String(username).trim().toLowerCase();
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return next(new ApiError(400, 'Username is already taken'));
    }
  }

  // If referral code is provided, verify that it belongs to an existing user account
  let validatedReferralCode = null;
  if (referralCode && String(referralCode).trim() !== '') {
    const cleanCode = String(referralCode).trim().toUpperCase();
    if (username && cleanCode === String(username).trim().toUpperCase()) {
      return next(new ApiError(400, 'You cannot use your own username as a referral code.'));
    }
    let referrer = await User.findOne({ referralCode: cleanCode });
    if (!referrer) {
      referrer = await User.findOne({ username: cleanCode.toLowerCase() });
    }
    if (!referrer) {
      return next(new ApiError(400, 'Invalid referral code. No account found with this referral code.'));
    }
    validatedReferralCode = cleanCode;
  }

  // In development, skip email verification for a frictionless signup flow.
  // Production keeps the OTP email verification flow below.
  if (process.env.NODE_ENV === 'development') {
    const suffix = crypto.randomBytes(3).toString('hex');
    const newUser = await User.create({
      email,
      password,
      role: (role === 'user' || !role) ? 'fan' : role,
      isVerified: true,
      username: username || `fan_${suffix}`,
      displayName: displayName || `Fan ${suffix.slice(0, 4)}`
    });

    // Apply referral bonus if code provided
    if (validatedReferralCode) {
      await applyReferralCode(newUser, validatedReferralCode);
    }

    // Initialize wallet if not created by referral
    const Wallet = require('../models/Wallet');
    const existingWallet = await Wallet.findOne({ userId: newUser._id });
    if (!existingWallet) {
      await Wallet.create({ userId: newUser._id, balanceCoins: 0 });
    }

    // If role is creator, automatically initialize CreatorProfile
    if (newUser.role === 'creator') {
      const existingProfile = await CreatorProfile.findOne({ userId: newUser._id });
      if (!existingProfile) {
        await CreatorProfile.create({
          userId: newUser._id,
          username: newUser.username,
          displayName: newUser.displayName,
          verificationStatus: 'approved'
        });
      }
    }

    return createSendToken(newUser, 201, res);
  }

  // Generate a 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Create unverified user
  const newUser = await User.create({
    email,
    password,
    role: (role === 'user' || !role) ? 'fan' : role,
    isVerified: false,
    pendingReferralCode: validatedReferralCode || undefined,
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
    user.username = user.role === 'creator' ? `creator_${suffix}` : `fan_${suffix}`;
    user.displayName = user.role === 'creator' ? `Creator ${user._id.toString().slice(-4)}` : `Fan ${user._id.toString().slice(-4)}`;
  }
  if (user.pendingReferralCode) {
    await applyReferralCode(user, user.pendingReferralCode);
    user.pendingReferralCode = undefined;
    await user.save();
  }

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
        displayName: user.displayName,
        verificationStatus: 'approved'
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

  // Hardcoded admin credentials check
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    // Create a mock admin user object for token generation
    const adminUser = {
      _id: 'admin-hardcoded',
      email: adminEmail,
      role: 'admin',
      isVerified: true,
      isSuspended: false,
      username: process.env.ADMIN_USERNAME || 'admin',
      displayName: 'Administrator',
      avatarUrl: '',
      comparePassword: async () => true,
      save: async () => {}
    };

    // Update last login (skip for hardcoded admin)
    const activity = buildLoginActivity(req);
    // No DB update for hardcoded admin

    return createSendToken(adminUser, 200, res);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new ApiError(401, 'Incorrect email or password'));
  }

  if (!user.isVerified) {
    return next(new ApiError(403, 'Email is not verified. Please verify your OTP.'));
  }

  if (user.isSuspended) {
    return next(new ApiError(403, 'Your account has been suspended by administration.'));
  }

  // Two-factor authentication challenge: email a code before completing sign-in
  if (user.twoFactorEnabled) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOtp = {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.send2FACode(user.email, code);
    } catch (err) {
      console.error('Error sending 2FA email:', err);
    }

    // Short-lived token proving the password step passed; final auth happens at /verify-2fa
    const pendingToken = jwt.sign(
      { id: user._id, step: '2fa' },
      process.env.JWT_SECRET || '1a9c4b789d701e67e3a8r3cb721867c293c6fe10b42f6ab3ercB5a5dfb0c7931',
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      status: 'success',
      requires2FA: true,
      pendingToken,
      message: 'Two-factor authentication code sent to your email'
    });
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  const activity = buildLoginActivity(req);
  await User.updateOne(
    { _id: user._id },
    { $push: { loginActivity: { $each: [activity], $slice: -50 } } }
  );

  createSendToken(user, 200, res);
});

// Complete the 2FA challenge and issue the real auth token
exports.verify2FA = catchAsync(async (req, res, next) => {
  const { pendingToken, code } = req.body;

  if (!pendingToken || !code) {
    return next(new ApiError(400, 'Please provide the pending token and 2FA code'));
  }

  let payload;
  try {
    payload = jwt.verify(
      pendingToken,
      process.env.JWT_SECRET || '1a9c4b789d701e67e3a8r3cb721867c293c6fe10b42f6ab3ercB5a5dfb0c7931'
    );
  } catch (err) {
    return next(new ApiError(401, '2FA session expired. Please sign in again.'));
  }

  if (!payload.id || payload.step !== '2fa') {
    return next(new ApiError(401, 'Invalid 2FA session'));
  }

  const user = await User.findById(payload.id).select('+password');
  if (!user) {
    return next(new ApiError(404, 'No user found'));
  }

  if (!user.twoFactorEnabled || !user.twoFactorOtp || !user.twoFactorOtp.code) {
    return next(new ApiError(400, 'Two-factor authentication is not enabled for this account'));
  }

  if (user.twoFactorOtp.code !== code) {
    return next(new ApiError(401, 'Invalid 2FA code'));
  }

  if (new Date() > user.twoFactorOtp.expiresAt) {
    return next(new ApiError(401, '2FA code has expired. Please sign in again.'));
  }

  // Code verified — finalize sign-in
  user.twoFactorOtp = undefined;
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  const activity = buildLoginActivity(req);
  await User.updateOne(
    { _id: user._id },
    { $push: { loginActivity: { $each: [activity], $slice: -50 } } }
  );

  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('token', 'loggedout', cookieOptions);

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
      avatarUrl: req.user.avatarUrl,
      bio: req.user.bio
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
    if (allowedFields.includes(key) && req.body[key] !== undefined) {
      filteredBody[key] = req.body[key];
    }
  });

  if (Object.keys(filteredBody).length === 0) {
    return next(new ApiError(400, 'No valid profile fields provided'));
  }

  // Username uniqueness check (ignore current user)
  if (filteredBody.username) {
    const cleanUsername = String(filteredBody.username).trim().toLowerCase();
    filteredBody.username = cleanUsername;
    const existing = await User.findOne({ username: cleanUsername, _id: { $ne: req.user._id } });
    if (existing) {
      return next(new ApiError(400, 'That username is already taken'));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  // Keep the creator profile in sync for creator accounts
  if (updatedUser.role === 'creator') {
    const profileUpdate = {};
    if (filteredBody.username) profileUpdate.username = filteredBody.username;
    if (filteredBody.displayName) profileUpdate.displayName = filteredBody.displayName;
    if (filteredBody.avatarUrl !== undefined) profileUpdate.avatarUrl = filteredBody.avatarUrl;
    if (filteredBody.bio !== undefined) profileUpdate.bio = filteredBody.bio;
    if (Object.keys(profileUpdate).length > 0) {
      await CreatorProfile.findOneAndUpdate({ userId: updatedUser._id }, profileUpdate, { new: true });
    }
  }

  res.status(200).json({
    status: 'success',
    user: {
      id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio
    }
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Please provide current password and new password'));
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword, user.password))) {
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

  // Remove uploaded media from cloud storage before deleting records (stream covers are kept)
  const awsService = require('../services/aws.service');
  const [userStories, userPosts, userMessages] = await Promise.all([
    Story.find({ creatorId: userId }).select('mediaUrl'),
    Post.find({ creatorId: userId }).select('media'),
    Message.find({ $or: [{ senderId: userId }, { receiverId: userId }], mediaUrl: { $ne: '' } }).select('mediaUrl')
  ]);
  const mediaUrls = userStories.map((s) => s.mediaUrl);
  userPosts.forEach((p) => {
    (p.media || []).forEach((m) => {
      mediaUrls.push(m.url);
      if (m.thumbnailUrl) mediaUrls.push(m.thumbnailUrl);
    });
  });
  userMessages.forEach((msg) => mediaUrls.push(msg.mediaUrl));
  await awsService.deleteS3Media(mediaUrls);

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
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };
  res.cookie('token', 'loggedout', cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'User account and all associated data deleted successfully'
  });
});
