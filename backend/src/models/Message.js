const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender']
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a receiver']
    },
    content: {
      type: String,
      trim: true
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    mediaType: {
      type: String,
      enum: ['none', 'image', 'video', 'gif', 'media'],
      default: 'none'
    },
    isGift: {
      type: Boolean,
      default: false
    },
    giftName: {
      type: String,
      default: ''
    },
    giftEmoji: {
      type: String,
      default: ''
    },
    giftCoins: {
      type: Number,
      default: 0
    },
    giftTier: {
      type: Number,
      default: 1
    },
    isPaywall: {
      type: Boolean,
      default: false
    },
    coinPrice: {
      type: Number,
      default: 0,
      min: [0, 'Coin price cannot be negative']
    },
    unlockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isOpened: {
      type: Boolean,
      default: false
    },
    // Users who soft-deleted this message for themselves (conversation delete).
    // The message stays in the DB so the peer keeps their chat history.
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for DM performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
