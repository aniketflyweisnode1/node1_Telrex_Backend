const mongoose = require('mongoose');

const contactFormQuerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    services: {
      type: String,
      required: false,
      trim: true,
      default: 'Help Desk Inquiry'
    },
    message: {
      type: String,
      required: false,
      trim: true,
      default: 'Contact request from help desk form'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'archived'],
      default: 'pending'
    },
    respondedAt: {
      type: Date
    },
    response: {
      type: String,
      trim: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Indexes for efficient searching and sorting
contactFormQuerySchema.index({ createdAt: -1 });
contactFormQuerySchema.index({ status: 1 });
contactFormQuerySchema.index({ name: 1 });
contactFormQuerySchema.index({ email: 1 });

module.exports = mongoose.model('ContactFormQuery', contactFormQuerySchema);

