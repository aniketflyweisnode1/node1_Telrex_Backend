const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    countryCode: { type: String, required: true },

    phoneNumber: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ['admin', 'doctor', 'patient', 'guest', 'sub-admin'],
      default: 'patient'
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    agreeConfirmation: {
      type: Boolean,
      required: true
    },

    isActive: {
      type: Boolean,
      default: false
    },

    lastLoginAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// 🔐 Hash password
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
