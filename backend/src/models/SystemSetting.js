const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    commissionRate: {
      type: Number,
      default: 0.20, // 20%
      min: [0, 'Commission cannot be negative'],
      max: [1, 'Commission cannot exceed 100%']
    },
    coinPackages: [
      {
        coins: {
          type: Number,
          required: true
        },
        priceUSD: {
          type: Number,
          required: true
        },
        oldPriceUSD: {
          type: Number,
          default: null
        },
        image: {
          type: String,
          default: '/coin.png'
        },
        isPopular: {
          type: Boolean,
          default: false
        },
        isActive: {
          type: Boolean,
          default: true
        },
        sortOrder: {
          type: Number,
          default: 0
        },
        bonusCoins: {
          type: Number,
          default: 0
        }
      }
    ],
    coinOffer: {
      bonusPercent: {
        type: Number,
        default: 20
      },
      endsAt: {
        type: Date,
        default: null
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    promoCodes: [
      {
        code: {
          type: String,
          required: true,
          uppercase: true,
          trim: true
        },
        bonusCoins: {
          type: Number,
          required: true
        },
        description: {
          type: String,
          default: ''
        },
        maxRedemptions: {
          type: Number,
          default: null
        },
        redemptionCount: {
          type: Number,
          default: 0
        },
        expiresAt: {
          type: Date,
          default: null
        },
        isActive: {
          type: Boolean,
          default: true
        },
        redeemedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          }
        ]
      }
    ]
  },
  {
    timestamps: true
  }
);

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

module.exports = SystemSetting;
