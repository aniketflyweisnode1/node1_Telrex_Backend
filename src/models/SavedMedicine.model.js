const mongoose = require('mongoose');

const savedMedicineSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    }
  },
  { timestamps: true }
);

// Compound index to ensure a patient can't save the same medicine twice
savedMedicineSchema.index({ patient: 1, medicine: 1 }, { unique: true });

// Index for efficient queries
savedMedicineSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('SavedMedicine', savedMedicineSchema);

