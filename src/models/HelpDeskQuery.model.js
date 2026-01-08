const mongoose = require('mongoose');

const helpDeskQuerySchema = new mongoose.Schema(
  {
    firstName: {
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
    message: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    response: {
      type: String,
      trim: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    tags: [{
      type: String,
      trim: true
    }],
    source: {
      type: String,
      enum: ['website', 'mobile_app', 'api', 'other'],
      default: 'website'
    },
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

// Indexes for efficient queries
helpDeskQuerySchema.index({ email: 1, createdAt: -1 });
helpDeskQuerySchema.index({ status: 1, createdAt: -1 });
helpDeskQuerySchema.index({ priority: 1, status: 1 });
helpDeskQuerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('HelpDeskQuery', helpDeskQuerySchema);

