const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: String,
  productType: {
    type: String,
    enum: ['medication', 'doctors_note', 'other'],
    default: 'medication'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  isSaved: {
    type: Boolean,
    default: false
  }
});

const cartSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      unique: true
    },
    items: [cartItemSchema],
    couponCode: String,
    discount: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    shippingCharges: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Calculate totals before save
cartSchema.pre('save', function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Reset tax, shipping, and discount if cart is empty
  if (this.subtotal === 0 || this.items.length === 0) {
    this.tax = 0;
    this.shippingCharges = 0;
    this.discount = 0;
    this.couponCode = undefined;
  } else {
    // Calculate tax (3% of subtotal)
    this.tax = this.subtotal * 0.03;
    
    // Set shipping charges (default ₹10 if not set)
    if (!this.shippingCharges || this.shippingCharges === 0) {
      this.shippingCharges = 10.00;
    }
  }
  
  // Calculate total amount
  this.totalAmount = this.subtotal + this.shippingCharges + this.tax - this.discount;
  
  next();
});

module.exports = mongoose.model('Cart', cartSchema);

