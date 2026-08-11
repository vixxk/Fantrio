const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true
    },
    displayName: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    role: {
      type: String,
      enum: ['user', 'fan', 'creator', 'admin'],
      default: 'fan'
    },
    otp: {
      code: { type: String },
      expiresAt: { type: Date }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    },
    // Real-time presence, kept in sync by the Socket.io layer (server.js).
    // Fans don't have a CreatorProfile, so their online state lives here;
    // creators get the same flag mirrored onto their CreatorProfile so every
    // presence consumer (calls, conversations, discover) stays consistent.
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeenAt: {
      type: Date,
      default: null
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorOtp: {
      code: { type: String },
      expiresAt: { type: Date }
    },
    notificationPreferences: {
      type: {
        newMessages: { type: Boolean, default: true },
        newSubscribers: { type: Boolean, default: true },
        tipsAndPayments: { type: Boolean, default: true },
        liveStreamReminders: { type: Boolean, default: true },
        productPurchases: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true }
      },
      default: () => ({
        newMessages: true,
        newSubscribers: true,
        tipsAndPayments: true,
        liveStreamReminders: true,
        productPurchases: true,
        announcements: true
      })
    },
    loginActivity: {
      type: [
        {
          device: { type: String, default: '' },
          ip: { type: String, default: '' },
          location: { type: String, default: '' },
          loggedInAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    pendingReferralCode: { type: String },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    blockedUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving & auto-assign unique 4-letter referral code (A-Z only)
userSchema.pre('save', async function (next) {
  const isAlpha4 = this.referralCode && /^[A-Z]{4}$/.test(this.referralCode);

  if (!isAlpha4) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code;
    let isUnique = false;
    let attempts = 0;
    const User = mongoose.model('User');
    while (!isUnique && attempts < 200) {
      attempts++;
      code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
      const existing = await User.findOne({ referralCode: code });
      if (!existing || existing._id.toString() === this._id.toString()) {
        isUnique = true;
      }
    }
    this.referralCode = code;
  }

  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password with hashed database password
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
