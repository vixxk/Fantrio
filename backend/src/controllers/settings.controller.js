const mongoose = require('mongoose');
const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const Faq = require('../models/Faq');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const emailService = require('../services/email.service');

// ==========================================
// PROFILE
// ==========================================
exports.getProfile = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      bio: req.user.bio,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt
    }
  });
});

// ==========================================
// SECURITY (2FA + login activity)
// ==========================================
exports.getSecurity = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    status: 'success',
    security: {
      twoFactorEnabled: user.twoFactorEnabled,
      lastLogin: user.lastLogin,
      loginActivity: (user.loginActivity || []).slice().reverse()
    }
  });
});

// Step 1: request a 2FA code via email
exports.enable2FA = catchAsync(async (req, res, next) => {
  if (req.user.twoFactorEnabled) {
    return next(new ApiError(400, 'Two-factor authentication is already enabled'));
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  req.user.twoFactorOtp = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  };
  await req.user.save({ validateBeforeSave: false });

  try {
    await emailService.send2FACode(req.user.email, code);
  } catch (err) {
    console.error('Error sending 2FA enable email:', err);
    // Don't fail the request — the code is stored and returned flows can still verify.
  }

  res.status(200).json({
    status: 'success',
    message: 'Verification code sent to your email'
  });
});

// Step 2: verify the emailed code and switch 2FA on
exports.verifyEnable2FA = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return next(new ApiError(400, 'Please provide the verification code'));
  }

  if (!req.user.twoFactorOtp || !req.user.twoFactorOtp.code) {
    return next(new ApiError(400, 'Request a verification code first'));
  }

  if (req.user.twoFactorOtp.code !== code) {
    return next(new ApiError(401, 'Invalid verification code'));
  }

  if (new Date() > req.user.twoFactorOtp.expiresAt) {
    return next(new ApiError(401, 'Verification code has expired. Please try again.'));
  }

  req.user.twoFactorEnabled = true;
  req.user.twoFactorOtp = undefined;
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    twoFactorEnabled: true,
    message: 'Two-factor authentication enabled successfully'
  });
});

exports.disable2FA = catchAsync(async (req, res, next) => {
  const { currentPassword } = req.body;

  if (!currentPassword) {
    return next(new ApiError(400, 'Please provide your current password'));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword, user.password))) {
    return next(new ApiError(401, 'Your current password is incorrect'));
  }

  user.twoFactorEnabled = false;
  user.twoFactorOtp = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    twoFactorEnabled: false,
    message: 'Two-factor authentication disabled'
  });
});

// ==========================================
// NOTIFICATION PREFERENCES
// ==========================================
const NOTIFICATION_KEYS = ['newMessages', 'newSubscribers', 'tipsAndPayments', 'liveStreamReminders', 'productPurchases', 'announcements'];

exports.getNotificationPreferences = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    preferences: req.user.notificationPreferences || {}
  });
});

exports.updateNotificationPreferences = catchAsync(async (req, res, next) => {
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (NOTIFICATION_KEYS.includes(key) && typeof req.body[key] === 'boolean') {
      updates[`notificationPreferences.${key}`] = req.body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(new ApiError(400, 'No valid notification preferences provided'));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    preferences: user.notificationPreferences
  });
});

// ==========================================
// PAYMENT METHODS
// ==========================================
exports.getPaymentMethods = catchAsync(async (req, res, next) => {
  const methods = await PaymentMethod.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

  res.status(200).json({
    status: 'success',
    paymentMethods: methods
  });
});

exports.addPaymentMethod = catchAsync(async (req, res, next) => {
  const { cardBrand, last4, holderName, expMonth, expYear, billingAddress, isDefault } = req.body;

  if (!cardNumberValid(last4)) {
    return next(new ApiError(400, 'Please provide the last 4 digits of your card'));
  }
  if (!holderName) {
    return next(new ApiError(400, 'Please provide the cardholder name'));
  }
  if (!expMonth || !expYear) {
    return next(new ApiError(400, 'Please provide the card expiry date'));
  }

  const existing = await PaymentMethod.find({ userId: req.user._id });
  const firstCard = existing.length === 0;

  const method = await PaymentMethod.create({
    userId: req.user._id,
    cardBrand: cardBrand || 'Visa',
    last4,
    holderName,
    expMonth,
    expYear,
    billingAddress: billingAddress || '',
    isDefault: isDefault || firstCard
  });

  // If it should be default, the model pre-save hook already unset others
  if (method.isDefault) {
    await PaymentMethod.updateMany(
      { userId: req.user._id, _id: { $ne: method._id } },
      { $set: { isDefault: false } }
    );
  }

  res.status(201).json({
    status: 'success',
    paymentMethod: method
  });
});

exports.updatePaymentMethod = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError(400, 'Invalid payment method id'));
  }

  const method = await PaymentMethod.findOne({ _id: id, userId: req.user._id });
  if (!method) {
    return next(new ApiError(404, 'Payment method not found'));
  }

  const allowedFields = ['cardBrand', 'last4', 'holderName', 'expMonth', 'expYear', 'billingAddress'];
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key) && req.body[key] !== undefined) {
      method[key] = req.body[key];
    }
  });

  if (req.body.isDefault) {
    await PaymentMethod.updateMany(
      { userId: req.user._id, _id: { $ne: method._id } },
      { $set: { isDefault: false } }
    );
    method.isDefault = true;
  }

  await method.save();

  res.status(200).json({
    status: 'success',
    paymentMethod: method
  });
});

exports.deletePaymentMethod = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError(400, 'Invalid payment method id'));
  }

  const method = await PaymentMethod.findOneAndDelete({ _id: id, userId: req.user._id });
  if (!method) {
    return next(new ApiError(404, 'Payment method not found'));
  }

  // Promote a remaining card to default if we just removed the default
  if (method.isDefault) {
    const nextMethod = await PaymentMethod.findOne({ userId: req.user._id });
    if (nextMethod) {
      nextMethod.isDefault = true;
      await nextMethod.save();
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Payment method removed'
  });
});

// ==========================================
// HELP CENTRE (FAQ)
// ==========================================
exports.getFaqs = catchAsync(async (req, res, next) => {
  const faqs = await Faq.find({ isActive: true }).sort({ order: 1, createdAt: 1 });

  res.status(200).json({
    status: 'success',
    faqs
  });
});

const cardNumberValid = (last4) => {
  return typeof last4 === 'string' && /^\d{4}$/.test(last4.trim());
};
