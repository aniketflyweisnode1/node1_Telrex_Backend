const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['lab_report', 'scan', 'xray', 'prescription', 'vaccination', 'other'],
      required: true
    },
    date: { type: Date, required: true },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    hospital: String,
    description: String,
    files: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    tags: [String],
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
      },
      sharedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthRecord', healthRecordSchema);

