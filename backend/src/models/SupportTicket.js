const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Please specify a subject'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Please provide ticket details/message'],
      trim: true
    },
    category: {
      type: String,
      enum: ['general', 'billing', 'technical', 'other'],
      default: 'general'
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'closed'],
      default: 'open'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
