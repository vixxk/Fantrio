const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A story must belong to a creator']
    },
    mediaUrl: {
      type: String,
      required: [true, 'A story must have a media URL']
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: [true, 'A story must have a media type']
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      index: true
    },
    views: [
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

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
