const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    },
    plan: {
      type: String,
      enum: ['Basic', 'Premium', 'VIP'],
      default: 'Premium'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true
    },
    priceCoins: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexing for quick verification queries
subscriptionSchema.index({ userId: 1, creatorId: 1, status: 1 });
subscriptionSchema.index({ creatorId: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
