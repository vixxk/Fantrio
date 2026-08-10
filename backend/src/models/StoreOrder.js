const mongoose = require('mongoose');

const storeOrderSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'An order must reference a product']
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An order must belong to a creator'],
      index: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An order must have a buyer'],
      index: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    amountCoins: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'fulfilled', 'cancelled', 'refunded'],
      default: 'completed'
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    // Optional buyer shipping/contact note (physical products)
    fulfillmentNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

storeOrderSchema.index({ creatorId: 1, createdAt: -1 });
storeOrderSchema.index({ buyerId: 1, createdAt: -1 });

const StoreOrder = mongoose.model('StoreOrder', storeOrderSchema);

module.exports = StoreOrder;
