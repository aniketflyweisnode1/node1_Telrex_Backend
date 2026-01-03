const mongoose = require('mongoose');

const doctorPayoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      unique: true,
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    // Bank account information
    bankAccount: {
      accountHolder: {
        type: String,
        required: true
      },
      bankName: {
        type: String,
        required: true
      },
      accountNumber: {
        type: String,
        required: true
      },
      routingNumber: {
        type: String,
        required: true
      },
      accountType: {
        type: String,
        enum: ['checking', 'savings'],
        default: 'checking'
      }
    },
    // Payout status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    // Payout method
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'wire_transfer', 'ach', 'check'],
      default: 'bank_transfer'
    },
    // Transaction details
    transactionId: String,
    payoutGateway: {
      type: String,
      enum: ['stripe', 'paypal', 'manual'],
      default: 'manual'
    },
    // Processing information
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    processedAt: Date,
    // Failure information
    failureReason: String,
    failedAt: Date,
    // Notes
    notes: String
  },
  { timestamps: true }
);

// Generate payout ID before save
doctorPayoutSchema.pre('save', async function (next) {
  if (!this.payoutId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.payoutId = `POUT-${timestamp}-${String(random).padStart(4, '0')}`;
  }
  next();
});

// Indexes for faster queries
// Note: payoutId already has index from unique: true
doctorPayoutSchema.index({ doctor: 1, createdAt: -1 });
doctorPayoutSchema.index({ status: 1 });

module.exports = mongoose.model('DoctorPayout', doctorPayoutSchema);

