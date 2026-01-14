const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
      type: String,
      unique: true,
      required: false // Will be auto-generated in pre-save hook
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: false // Optional - can be added later
    },
    medicine: { 
      type: String, 
      required: true,
      trim: true
    },
    brand: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String, 
      required: true,
      trim: true
    },
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
  if (!this.prescriptionNumber || this.prescriptionNumber === '') {
    try {
      // Generate unique prescription number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.prescriptionNumber = `PRES${timestamp}${random}`;
      
      // Ensure uniqueness by checking if it exists
      const existing = await mongoose.model('Prescription').findOne({ prescriptionNumber: this.prescriptionNumber });
      if (existing) {
        // If exists, regenerate with new random number
        const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.prescriptionNumber = `PRES${timestamp}${newRandom}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);

