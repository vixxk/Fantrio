const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wallet must belong to a user'],
      unique: true
    },
    balanceCoins: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Wallet balance cannot be negative']
    },
    // Creator payout details (masked before sending to the client)
    payoutMethod: {
      accountHolder: { type: String, default: '' },
      bankName: { type: String, default: '' },
      routingNumber: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      verified: { type: Boolean, default: false },
      payoutSchedule: { type: String, default: 'weekly' },
      currency: { type: String, default: 'usd' },
      minimumPayout: { type: Number, default: 100 }
    }
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
