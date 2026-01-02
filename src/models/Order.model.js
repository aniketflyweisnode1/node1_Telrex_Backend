const mongoose = require('mongoose');

/**
 * Order Item Schema
 */
const orderItemSchema = new mongoose.Schema(
  {
    prescriptionItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    productId: String,
    productType: {
      type: String,
      enum: ['medication', 'doctors_note', 'other'],
      default: 'medication'
    },
    medicationName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'added', 'saved', 'ordered'],
      default: 'pending'
    },
    isSaved: {
      type: Boolean,
      default: false
    }
  },
  { _id: true } // Enable _id for items so we can identify them
);

/**
 * Order Schema
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true // faster lookup
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },

    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must have at least one item'
      }
    },

    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true
    },

    billingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
      streetAddress: String,
      city: String,
      state: String,
      zipCode: String
    },

    billingAddressSameAsShipping: {
      type: Boolean,
      default: true
    },

    subtotal: {
      type: Number,
      required: true,
      default: 0
    },

    shippingCharges: {
      type: Number,
      default: 0
    },

    tax: {
      type: Number,
      default: 0
    },

    discount: {
      type: Number,
      default: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },

    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned'
      ],
      default: 'pending'
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },

    trackingNumber: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    notes: String
  },
  { timestamps: true }
);

/**
 * Auto-generate Order Number (SAFE)
 */
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
