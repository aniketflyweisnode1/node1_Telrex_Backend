const mongoose = require('mongoose');

const refillSchema = new mongoose.Schema(
  {
    refillNumber: {
      type: String,
      unique: true,
      required: false // Generated in pre-save hook
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
       required: true
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'skipped'],
      default: 'pending'
    },
    requestedDate: {
      type: Date,
      default: Date.now
    },
    approvedDate: Date,
    rejectedDate: Date,
    completedDate: Date,
    cancelledDate: Date,
    skippedDate: Date,
    rejectionReason: String,
    skipReason: String,
    notes: String,
    // Medication details for refill
    medicationName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    dosage: String,
    frequency: String,
    instructions: String,
    // Price at time of refill request
    unitPrice: Number,
    totalPrice: Number,
    // Link to order if refill is converted to order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    // Refill count tracking
    refillCount: {
      type: Number,
      default: 0
    },
    maxRefills: {
      type: Number,
      default: 3
    },
    // Auto-refill settings
    autoRefill: {
      type: Boolean,
      default: false
    },
    autoRefillFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'biannual', 'annual'],
      default: 'monthly'
    }
  },
  { timestamps: true }
);

// Generate refill number before save
refillSchema.pre('save', async function (next) {
  if (!this.refillNumber) {
    let isUnique = false;
    let newRefillNumber;
    while (!isUnique) {
      newRefillNumber = `REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const existingRefill = await mongoose.model('Refill').findOne({ refillNumber: newRefillNumber });
      if (!existingRefill) {
        isUnique = true;
      }
    }
    this.refillNumber = newRefillNumber;
  }
  next();
});

// Indexes
refillSchema.index({ patient: 1, status: 1 });
refillSchema.index({ medicine: 1, status: 1 });
refillSchema.index({ createdAt: -1 });
// refillNumber already has unique: true which creates an index, so no need for separate index

module.exports = mongoose.model('Refill', refillSchema);

