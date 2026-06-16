const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Call log must have a caller']
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Call log must have a receiver']
    },
    roomId: {
      type: String,
      required: [true, 'Call log must have a roomId'],
      unique: true
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'active', 'completed', 'missed', 'rejected'],
      default: 'initiated'
    },
    coinRatePerMinute: {
      type: Number,
      required: true,
      min: [0, 'Call rate cannot be negative']
    },
    totalMinutesBilling: {
      type: Number,
      default: 0
    },
    totalCoinsBilled: {
      type: Number,
      default: 0
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

const CallLog = mongoose.model('CallLog', callLogSchema);

module.exports = CallLog;
