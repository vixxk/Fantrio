const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Null if external payment gateway deposit
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Null if platform package purchase
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'subscription', 'tip', 'ppv_unlock', 'call_billing'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    amountCoins: {
      type: Number,
      required: true
    },
    amountUSD: {
      type: Number,
      default: 0
    },
    gateway: {
      type: String,
      enum: ['segpay', 'ccbill', 'internal'],
      default: 'internal'
    },
    gatewayTxId: {
      type: String,
      default: null
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null // Dynamic reference (Post, Message, CallLog)
    }
  },
  {
    timestamps: true
  }
);

// Indexing for quick ledger audits
transactionSchema.index({ senderId: 1, type: 1, referenceId: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
