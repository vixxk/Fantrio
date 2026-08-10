const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A product must belong to a creator'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    priceCoins: {
      type: Number,
      required: [true, 'Please provide a price in coins'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      enum: ['coins'],
      default: 'coins'
    },
    inventory: {
      // null means unlimited (digital products)
      type: Number,
      default: null,
      min: 0
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'out_of_stock'],
      default: 'draft'
    },
    category: {
      type: String,
      default: 'Merchandise'
    },
    media: [
      {
        url: { type: String, default: '' },
        type: { type: String, enum: ['image', 'video'], default: 'image' }
      }
    ],
    thumbnailUrl: {
      type: String,
      default: ''
    },
    isDigital: {
      type: Boolean,
      default: false
    },
    deliveryNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Derive status from inventory before saving (active products with 0 stock -> out_of_stock)
productSchema.pre('save', function (next) {
  if (this.inventory !== null && this.inventory === 0 && this.status === 'active') {
    this.status = 'out_of_stock';
  }
  if (this.inventory !== null && this.inventory > 0 && this.status === 'out_of_stock') {
    this.status = 'active';
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
