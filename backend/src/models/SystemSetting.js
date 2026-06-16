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
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

module.exports = SystemSetting;
