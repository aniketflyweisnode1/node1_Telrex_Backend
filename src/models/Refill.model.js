const mongoose = require('mongoose');

const refillSchema = new mongoose.Schema(
  {
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      index: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    refillNumber: {
      type: String,
      unique: true,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    requestedDate: {
      type: Date,
      default: Date.now
    },
    approvedDate: Date,
    rejectedDate: Date,
    completedDate: Date,
    rejectionReason: String,
    notes: String,
    // Medications to refill (can be subset of prescription medications)
    medications: [{
      medicationName: {
        type: String,
        required: true
      },
      dosage: String,
      frequency: String,
      quantity: {
        type: Number,
        required: true
      },
      instructions: String
    }],
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
      default: 3 // Default max refills allowed
    }
  },
  { timestamps: true }
);

// Generate refill number before save
refillSchema.pre('save', async function (next) {
  if (!this.refillNumber) {
    const count = await mongoose.model('Refill').countDocuments();
    this.refillNumber = `REF${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes
refillSchema.index({ patient: 1, status: 1 });
refillSchema.index({ prescription: 1, status: 1 });
refillSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Refill', refillSchema);

