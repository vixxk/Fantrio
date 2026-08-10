const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['first_deposit', 'referral_claimed', 'first_audio_call'],
      required: true
    },
    coins: {
      type: Number,
      required: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// A user can only earn each reward once
rewardSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Reward', rewardSchema);
