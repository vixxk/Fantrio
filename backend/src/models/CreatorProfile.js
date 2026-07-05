const mongoose = require('mongoose');

const creatorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Profile must belong to a user'],
      unique: true
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (val) {
          return /^[a-zA-Z0-9_]+$/.test(val);
        },
        message: 'Username can only contain letters, numbers, and underscores (no spaces or special characters).'
      }
    },
    displayName: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    coverBannerUrl: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    categories: {
      type: [String],
      default: []
    },
    isVerifiedBadge: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rates: {
      subscriptionMonthly: {
        type: Number,
        default: 0,
        min: [0, 'Subscription price cannot be negative']
      },
      audioCallPerMin: {
        type: Number,
        default: 0,
        min: [0, 'Audio call rate cannot be negative']
      },
      videoCallPerMin: {
        type: Number,
        default: 0,
        min: [0, 'Video call rate cannot be negative']
      }
    },
    seoTags: {
      metaTitle: {
        type: String,
        default: ''
      },
      metaDescription: {
        type: String,
        default: ''
      },
      openGraphTags: {
        type: Map,
        of: String,
        default: new Map()
      }
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0
    },
    subscriberCount: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 1200
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    isLive: {
      type: Boolean,
      default: false
    },
    audioAvailable: {
      type: Boolean,
      default: true
    },
    videoAvailable: {
      type: Boolean,
      default: true
    },
    country: {
      type: String,
      default: 'United States'
    },
    language: {
      type: String,
      default: 'English'
    },
    contentType: {
      type: [String],
      enum: ['Photos', 'Videos', 'PPV'],
      default: ['Photos', 'Videos']
    }
  },
  {
    timestamps: true
  }
);

const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);

module.exports = CreatorProfile;
