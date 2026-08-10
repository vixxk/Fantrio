const mongoose = require('mongoose');

/**
 * A single chat message sent inside a live stream room.
 * Room-scoped (no sender/receiver pair): viewers and the host post into a
 * stream, and the message is broadcast to everyone watching that stream.
 */
const LiveChatMessageSchema = new mongoose.Schema(
  {
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

// Chat history is always queried per-stream, newest first.
LiveChatMessageSchema.index({ streamId: 1, createdAt: -1 });

module.exports = mongoose.model('LiveChatMessage', LiveChatMessageSchema);
