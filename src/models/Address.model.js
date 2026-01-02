const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    countryCode: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Ensure only one default address per patient
addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await mongoose.model('Address').updateMany(
      { patient: this.patient, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema);

