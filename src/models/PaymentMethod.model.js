const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    type: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet'],
      required: true,
      default: 'card'
    },
    // Card details
    cardType: {
      type: String,
      enum: ['credit', 'debit'],
      required: function() { return this.type === 'card'; }
    },
    bankName: String, // SBI, ICICI, etc.
    cardNumber: {
      type: String,
      required: function() { return this.type === 'card'; }
    },
    cardLast4: {
      type: String,
      required: function() { return this.type === 'card'; }
    },
    expiryDate: {
      type: String, // MM/YY format
      required: function() { return this.type === 'card'; }
    },
    cardHolderName: String,
    cardBrand: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover', 'rupay', 'other']
    },
    // Security
    securityCode: {
      type: String,
      select: false // Never return in queries
    },
    // UPI details
    upiId: {
      type: String,
      required: function() { return this.type === 'upi'; }
    },
    // Wallet details
    walletType: {
      type: String,
      enum: ['paytm', 'phonepe', 'googlepay', 'amazonpay', 'other'],
      required: function() { return this.type === 'wallet'; }
    },
    walletId: {
      type: String,
      required: function() { return this.type === 'wallet'; }
    },
    // Netbanking
    bankAccountNumber: {
      type: String,
      required: function() { return this.type === 'netbanking'; }
    },
    ifscCode: {
      type: String,
      required: function() { return this.type === 'netbanking'; }
    },
    // Status
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Payment gateway token (for secure storage)
    gatewayToken: String,
    gatewayProvider: String
  },
  { timestamps: true }
);

// Ensure only one default payment method per patient
paymentMethodSchema.pre('save', async function (next) {
  if (this.isDefault && this.isActive) {
    await mongoose.model('PaymentMethod').updateMany(
      { patient: this.patient, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Index for faster queries
paymentMethodSchema.index({ patient: 1, isActive: 1 });
paymentMethodSchema.index({ patient: 1, isDefault: 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

