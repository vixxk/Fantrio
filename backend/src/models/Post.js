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
          enum: ['image', 'video'],
          required: true
        },
        isLocked: {
          type: Boolean,
          default: false
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
