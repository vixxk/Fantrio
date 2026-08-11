const mongoose = require('mongoose');

const featureRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a feature title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please describe the feature request'],
      trim: true
    },
    votes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['suggestion', 'under-review', 'planned', 'completed'],
      default: 'suggestion'
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FeatureRequest', featureRequestSchema);
