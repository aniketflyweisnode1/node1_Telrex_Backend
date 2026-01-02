const mongoose = require('mongoose');

const pastMedicationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },
    doctor: {
      type: String,
      required: true
    },
    issueDate: {
      type: Date,
      required: true,
      index: true
    },
    prescribedMedications: [{
      type: String,
      required: true
    }],
    clinic: {
      type: String,
      required: true
    },
    diagnosedCondition: {
      type: String,
      required: true
    },
    note: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for efficient queries
pastMedicationSchema.index({ patient: 1, issueDate: -1 });

module.exports = mongoose.model('PastMedication', pastMedicationSchema);

