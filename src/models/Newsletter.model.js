const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed', 'pending'],
      default: 'subscribed'
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    unsubscribedAt: {
      type: Date
    },
    source: {
      type: String,
      default: 'website' // website, mobile_app, admin, etc.
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
// email already has index from unique: true, so no need for separate index
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ subscribedAt: -1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);

