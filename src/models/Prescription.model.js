const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  quantity: { type: Number, required: true },
  instructions: String,
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
      type: String,
      unique: true,
      required: true
    },
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
    diagnosis: { type: String, required: true },
    medications: [medicationSchema],
    instructions: String,
    followUpDate: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    },
    pdfUrl: String,
    isOrdered: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Generate prescription number before save
prescriptionSchema.pre('save', async function (next) {
  if (!this.prescriptionNumber) {
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionNumber = `PRES${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);

