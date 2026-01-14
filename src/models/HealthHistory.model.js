const mongoose = require('mongoose');

const healthHistorySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
healthHistorySchema.index({ patient: 1, createdAt: -1 });
healthHistorySchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('HealthHistory', healthHistorySchema);

