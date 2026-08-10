const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    cardBrand: {
      type: String,
      enum: ['Visa', 'Mastercard', 'Amex', 'Discover'],
      default: 'Visa'
    },
    last4: {
      type: String,
      required: [true, 'Please provide the last 4 digits of the card'],
      match: [/^\d{4}$/, 'Last 4 digits must be exactly 4 numbers']
    },
    holderName: {
      type: String,
      required: [true, 'Please provide the cardholder name'],
      trim: true
    },
    expMonth: {
      type: Number,
      required: [true, 'Please provide the expiry month'],
      min: 1,
      max: 12
    },
    expYear: {
      type: Number,
      required: [true, 'Please provide the expiry year'],
      min: 2020,
      max: 2100
    },
    billingAddress: {
      type: String,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Only one default card per user
paymentMethodSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
