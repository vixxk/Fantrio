const mongoose = require('mongoose');
const User = require('../../models/User');
const PaymentMethod = require('../../models/PaymentMethod');
const Faq = require('../../models/Faq');
const ApiError = require('../../utils/apiError');
const catchAsync = require('../../utils/catchAsync');

// ==========================================
// USER SECURITY AUDIT
// ==========================================
exports.getUserSecurity = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  res.status(200).json({
    status: 'success',
    security: {
      twoFactorEnabled: user.twoFactorEnabled,
      lastLogin: user.lastLogin,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      loginActivity: (user.loginActivity || []).slice().reverse()
    }
  });
});

// Force-disable 2FA (e.g. lost device / support ticket)
exports.forceDisable2FA = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  user.twoFactorEnabled = false;
  user.twoFactorOtp = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    twoFactorEnabled: false,
    message: 'Two-factor authentication disabled for this fan'
  });
});

// ==========================================
// PLATFORM-WIDE LOGIN ACTIVITY
// ==========================================
exports.getLoginActivity = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit || '50', 10);

  const users = await User.find({ 'loginActivity.0': { $exists: true } })
    .select('username displayName email avatarUrl loginActivity')
    .sort({ 'loginActivity.loggedInAt': -1 })
    .limit(100);

  const entries = [];
  for (const u of users) {
    for (const entry of u.loginActivity || []) {
      entries.push({
        userId: u._id,
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        device: entry.device,
        ip: entry.ip,
        location: entry.location,
        loggedInAt: entry.loggedInAt
      });
    }
  }

  entries.sort((a, b) => new Date(b.loggedInAt) - new Date(a.loggedInAt));

  res.status(200).json({
    status: 'success',
    total: entries.length,
    entries: entries.slice(0, limit)
  });
});

// ==========================================
// USER PAYMENT METHODS
// ==========================================
exports.getUserPaymentMethods = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiError(404, 'Fan not found'));
  }

  const paymentMethods = await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

  res.status(200).json({
    status: 'success',
    paymentMethods
  });
});

exports.deleteUserPaymentMethod = catchAsync(async (req, res, next) => {
  const { userId, methodId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(methodId)) {
    return next(new ApiError(400, 'Invalid payment method id'));
  }

  const method = await PaymentMethod.findOneAndDelete({ _id: methodId, userId });
  if (!method) {
    return next(new ApiError(404, 'Payment method not found for this fan'));
  }

  res.status(200).json({
    status: 'success',
    message: 'Payment method removed'
  });
});

// ==========================================
// FAQ MANAGEMENT
// ==========================================
exports.getFaqs = catchAsync(async (req, res, next) => {
  const { search, category } = req.query;
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const skip = (page - 1) * limit;

  const query = {};
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { question: { $regex: search, $options: 'i' } },
      { answer: { $regex: search, $options: 'i' } }
    ];
  }

  const faqs = await Faq.find(query).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit);
  const total = await Faq.countDocuments(query);

  res.status(200).json({
    status: 'success',
    total,
    page,
    limit,
    faqs
  });
});

exports.createFaq = catchAsync(async (req, res, next) => {
  const { question, answer, category, order, isActive } = req.body;

  if (!question || !answer) {
    return next(new ApiError(400, 'Question and answer are required'));
  }

  const faq = await Faq.create({
    question,
    answer,
    category: category || 'general',
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true
  });

  res.status(201).json({
    status: 'success',
    faq
  });
});

exports.updateFaq = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const faq = await Faq.findById(id);
  if (!faq) {
    return next(new ApiError(404, 'FAQ item not found'));
  }

  const allowedFields = ['question', 'answer', 'category', 'order', 'isActive'];
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key) && req.body[key] !== undefined) {
      faq[key] = req.body[key];
    }
  });

  await faq.save();

  res.status(200).json({
    status: 'success',
    faq
  });
});

exports.deleteFaq = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) {
    return next(new ApiError(404, 'FAQ item not found'));
  }

  res.status(200).json({
    status: 'success',
    message: 'FAQ item deleted'
  });
});
