const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet'],
      required: true,
      default: 'card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    transactionId: String,
    paymentGateway: {
      type: String,
      enum: ['stripe'],
      default: 'stripe'
    },
    // Stripe specific fields
    stripePaymentIntentId: String,
    stripeClientSecret: String,
    stripeChargeId: String,
    stripeRefundId: String,
    // Gateway response (stores full response from payment gateway)
    gatewayResponse: mongoose.Schema.Types.Mixed,
    // Payment verification
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    // Refund details
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    // Payment timestamps
    paidAt: Date,
    failedAt: Date,
    failureReason: String
  },
  { timestamps: true }
);

// Generate payment ID before save
paymentSchema.pre('save', async function (next) {
  if (!this.paymentId) {
    // Generate unique payment ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.paymentId = `PAY-${timestamp}-${String(random).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

