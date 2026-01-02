const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minPurchaseAmount: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number
    },
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applicableTo: {
      type: String,
      enum: ['all', 'medications', 'doctors_note'],
      default: 'all'
    }
  },
  { timestamps: true }
);

// Index for efficient queries
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

