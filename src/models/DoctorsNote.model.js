const mongoose = require('mongoose');

const doctorsNoteSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    type: {
      type: String,
      enum: ['illness', 'injury'],
      required: true
    },
    purpose: {
      type: String,
      enum: ['work', 'school'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    patientName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    price: {
      type: Number,
      required: true,
      default: 39.00
    },
    noteContent: String,
    issuedAt: Date,
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  },
  { timestamps: true }
);

// Index for efficient queries
doctorsNoteSchema.index({ patient: 1, createdAt: -1 });
doctorsNoteSchema.index({ status: 1 });

module.exports = mongoose.model('DoctorsNote', doctorsNoteSchema);

