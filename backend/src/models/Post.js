const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A post must belong to a creator']
    },
    content: {
      type: String,
      trim: true
    },
    media: [
      {
        url: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['image', 'video', 'audio'],
          required: true
        },
        isLocked: {
          type: Boolean,
          default: false
        },
        thumbnailUrl: {
          type: String,
          default: null
        },
        isBlurred: {
          type: Boolean,
          default: true
        }
      }
    ],
    postType: {
      type: String,
      enum: ['free', 'subscription', 'ppv'],
      default: 'free'
    },
    coinPrice: {
      type: Number,
      default: 0,
      min: [0, 'Coin price cannot be negative']
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        text: {
          type: String,
          required: true,
          trim: true
        },
        isGift: {
          type: Boolean,
          default: false
        },
        giftEmoji: {
          type: String,
          default: null
        },
        giftName: {
          type: String,
          default: null
        },
        giftTier: {
          type: Number,
          default: 1
        },
        giftCoins: {
          type: Number,
          default: 0
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    commentCount: {
      type: Number,
      default: 0
    },
    sharesCount: {
      type: Number,
      default: 0
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    // Creator-hide toggle: hidden posts are invisible to all users (feed, media
    // feed, profile, unlocks) but stay visible to the owner on creator pages.
    isHidden: {
      type: Boolean,
      default: false
    },
    reports: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reason: {
          type: String,
          required: true
        },
        description: {
          type: String,
          trim: true,
          default: ''
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Pre-save hook to handle scheduling state
postSchema.pre('save', function (next) {
  if (this.scheduledFor && this.scheduledFor > new Date()) {
    this.isPublished = false;
  } else {
    this.isPublished = true;
  }
  
  if (this.comments) {
    this.commentCount = this.comments.length;
  }
  
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
