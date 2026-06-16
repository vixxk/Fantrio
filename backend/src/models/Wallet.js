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
    }
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
