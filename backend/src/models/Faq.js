const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please provide a question'],
      trim: true
    },
    answer: {
      type: String,
      required: [true, 'Please provide an answer'],
      trim: true
    },
    category: {
      type: String,
      enum: ['general', 'account', 'billing', 'technical', 'safety'],
      default: 'general'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;
