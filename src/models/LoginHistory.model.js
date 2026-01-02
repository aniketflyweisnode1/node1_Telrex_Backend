const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    loginMethod: {
      type: String,
      enum: ['password', 'otp'],
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String
    },
    device: {
      type: String
    },
    browser: {
      type: String
    },
    os: {
      type: String
    },
    location: {
      country: String,
      city: String,
      region: String
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
      default: 'success'
    },
    failureReason: {
      type: String
    },
    loginAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

// Index for efficient queries
loginHistorySchema.index({ user: 1, loginAt: -1 });
loginHistorySchema.index({ ipAddress: 1 });
loginHistorySchema.index({ loginAt: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);

