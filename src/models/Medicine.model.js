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
      trim: true
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
    
    // Images structure (thumbnail and gallery)
    images: {
      thumbnail: {
        type: String,
        trim: true
      },
      gallery: [{
        type: String,
        trim: true
      }]
    },
    
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
    // Health Category and Type relationships
    healthCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCategory'
    },
    healthTypeSlug: {
      type: String,
      trim: true
    },
    // Admin managed flags
    isTrendy: {
      type: Boolean,
      default: false
    },
    isBestOffer: {
      type: Boolean,
      default: false
    },
    // Discount percentage for best offers (optional - if not set, calculated from prices)
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    // Popularity tracking
    views: {
      type: Number,
      default: 0,
      min: 0
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
medicineSchema.index({ healthCategory: 1 });
medicineSchema.index({ healthTypeSlug: 1 });
medicineSchema.index({ isTrendy: 1 });
medicineSchema.index({ isBestOffer: 1 });
medicineSchema.index({ status: 1 });
medicineSchema.index({ isActive: 1 });
medicineSchema.index({ views: -1 });

module.exports = mongoose.model('Medicine', medicineSchema);

