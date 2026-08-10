const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A live stream must belong to a creator'],
      index: true
    },
    streamTitle: {
      type: String,
      required: [true, 'Please provide a stream title'],
      trim: true
    },
    coverUrl: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      index: true
    },
    language: {
      type: String,
      default: 'English'
    },
    // Derived state: 'scheduled' -> 'live' -> 'ended' (or 'cancelled' for
    // scheduled streams that never went live). Kept in sync by the pre-save hook
    // while `isLive` remains for backwards compatibility with existing code.
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'ended',
      index: true
    },
    isLive: {
      type: Boolean,
      default: true,
      index: true
    },
    scheduledAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    // Monetization: cost in coins to enter the stream (0 = free).
    entryPriceCoins: {
      type: Number,
      default: 0,
      min: [0, 'Entry price cannot be negative']
    },
    // When true, active subscribers of the creator enter for free.
    freeForSubscribers: {
      type: Boolean,
      default: false
    },
    // Concurrent viewers (used to compute an accurate viewer count).
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    viewerCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // All-time metrics used by creator analytics.
    peakViewers: {
      type: Number,
      default: 0,
      min: 0
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    roomId: {
      type: String,
      required: true,
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Derive `status` from the source-of-truth fields before every save.
liveStreamSchema.pre('save', function (next) {
  if (this.isLive) {
    this.status = 'live';
  } else if (this.cancelledAt) {
    this.status = 'cancelled';
  } else if (this.scheduledAt && new Date(this.scheduledAt) > new Date()) {
    this.status = 'scheduled';
  } else if (this.scheduledAt) {
    // Overdue scheduled stream that never went live.
    this.status = 'scheduled';
  } else if (this.endedAt) {
    this.status = 'ended';
  } else {
    this.status = 'ended';
  }
  next();
});

// Ensure viewerCount always mirrors the viewers array after save operations.
liveStreamSchema.post('save', async function (doc) {
  if (doc.viewers && doc.viewers.length !== doc.viewerCount) {
    await mongoose.model('LiveStream').updateOne(
      { _id: doc._id },
      { $set: { viewerCount: doc.viewers.length } }
    );
  }
});

liveStreamSchema.index({ creatorId: 1, status: 1, scheduledAt: -1 });

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

module.exports = LiveStream;
