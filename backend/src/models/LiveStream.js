const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A live stream must belong to a creator']
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
      required: [true, 'Please select a category']
    },
    language: {
      type: String,
      default: 'English'
    },
    isLive: {
      type: Boolean,
      default: true,
      index: true
    },
    viewerCount: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    zegoRoomId: {
      type: String,
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

module.exports = LiveStream;
