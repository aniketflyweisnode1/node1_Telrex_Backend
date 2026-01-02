const mongoose = require('mongoose');

// Dosage Option Schema
const dosageOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  priceAdjustment: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: true });

// Quantity Option Schema
const quantityOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  priceAdjustment: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: true });

// Medicine Schema
const medicineSchema = new mongoose.Schema(
  {
    // Basic Information
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Product Images - Multiple images support
    productImages: [{
      fileName: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileType: {
        type: String
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Usage and Description - Array of objects
    usage: [{
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }],
    
    // Description/How it works
    description: {
      type: String,
      trim: true
    },
    howItWorks: {
      type: String,
      trim: true
    },
    
    // Generics - Array of strings
    generics: [{
      type: String,
      trim: true
    }],
    
    // Dosage Options - Array of dosage options
    dosageOptions: [dosageOptionSchema],
    
    // Quantity Options - Array of quantity options
    quantityOptions: [quantityOptionSchema],
    
    // Medical Information - Paragraphs (text fields)
    precautions: {
      type: String,
      trim: true
    },
    sideEffects: {
      type: String,
      trim: true
    },
    drugInteractions: {
      type: String,
      trim: true
    },
    indications: {
      type: String,
      trim: true
    },
    
    // Additional fields
    category: {
      type: String,
      trim: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock'
    },
    visibility: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
medicineSchema.index({ productName: 'text', brand: 'text' });
medicineSchema.index({ category: 1 });
medicineSchema.index({ status: 1 });
medicineSchema.index({ isActive: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);

