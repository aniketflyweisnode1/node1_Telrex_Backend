const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phoneNumber: String,
    email: String,
    countryCode: String,
    otp: String,
    expiresAt: Date,
    type: {
      type: String,
      enum: ['phone', 'email'],
      default: 'phone'
    }
  },
  { timestamps: true }
);

// Index for efficient queries
otpSchema.index({ phoneNumber: 1 });
otpSchema.index({ email: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
