const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    countryCode: { 
      type: String, 
      required: function() {
        // Country code is required only if not using OAuth (Google or Facebook)
        return !this.googleId && !this.facebookId;
      }
    },

    phoneNumber: {
      type: String,
      required: function() {
        // Phone number is required only if not using OAuth (Google or Facebook)
        return !this.googleId && !this.facebookId;
      },
      unique: true,
      sparse: true // Allows multiple null values
    },

    email: {
      type: String,
      lowercase: true
    },

    password: {
      type: String,
      required: function() {
        // Password is required only if not using OAuth (Google or Facebook)
        return !this.googleId && !this.facebookId;
      },
      select: false
    },

    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values, unique already creates index
    },

    // Facebook OAuth
    facebookId: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values, unique already creates index
    },

    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local'
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
      required: function() {
        // Agree confirmation is required only if not using OAuth (Google or Facebook)
        return !this.googleId && !this.facebookId;
      },
      default: false
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

// 🔐 Hash password (only if password is provided and not using OAuth)
userSchema.pre('save', async function (next) {
  try {
    // Skip password hashing if using OAuth (Google or Facebook) or password not modified
    if (!this.isModified('password') || !this.password || this.googleId || this.facebookId) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
