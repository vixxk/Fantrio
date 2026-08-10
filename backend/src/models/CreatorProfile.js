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
    isTopRated: {
      type: Boolean,
      default: true
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
    // Subscription plan tiers. `subscriptionMonthly` remains the default (Premium) price
    // when no explicit tiers are configured.
    subscriptionPlans: {
      type: [
        {
          name: {
            type: String,
            enum: ['Basic', 'Premium', 'VIP'],
            default: 'Premium'
          },
          priceCoins: {
            type: Number,
            default: 0,
            min: [0, 'Plan price cannot be negative']
          },
          features: {
            type: [String],
            default: []
          },
          isActive: {
            type: Boolean,
            default: true
          }
        }
      ],
      default: []
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
    profileViews: {
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
    // Privacy & preference settings (stored on the profile so the real
    // presence flag `isOnline` stays untouched by the settings page)
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['Public', 'Private', 'Subscribers Only'],
      default: 'Public'
    },
    defaultStreamType: {
      type: String,
      enum: ['Live Video', 'Audio Only'],
      default: 'Live Video'
    },
    defaultCallType: {
      type: String,
      enum: ['Audio Call', 'Video Call'],
      default: 'Audio Call'
    },
    timezone: {
      type: String,
      default: '(GMT-05:00) Eastern Time'
    },
    contentMaturity: {
      type: String,
      enum: ['General Audience', 'Mature Audience'],
      default: 'General Audience'
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

// Index used by profile-visibility enforcement (feed/story/live filtering)
creatorProfileSchema.index({ profileVisibility: 1, userId: 1 });

const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);

module.exports = CreatorProfile;
