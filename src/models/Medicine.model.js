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
    
    // Usage - Array of strings (with backward compatibility for old object format)
    usage: [{
      type: mongoose.Schema.Types.Mixed,
      set: function(value) {
        // If it's already a string, return it
        if (typeof value === 'string') {
          return value.trim();
        }
        // If it's an object (old format), convert to string
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (value.title && value.description) {
            return `${value.title}: ${value.description}`;
          }
          // If it has description only
          if (value.description) {
            return value.description;
          }
          // If it has title only
          if (value.title) {
            return value.title;
          }
        }
        // Return as string if it's something else
        return String(value);
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
    
    // Generics - Array of strings (keeping original format)
    generics: [{
      type: String,
      trim: true
    }],
    
    // Markup for the medicine (percentage or fixed amount)
    markup: {
      type: Number,
      default: 0,
      min: 0
    },
    
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

// Pre-save hook to normalize usage array (convert old object format to new string format)
medicineSchema.pre('save', function(next) {
  if (this.usage && Array.isArray(this.usage)) {
    this.usage = this.usage.map(item => {
      // If it's already a string, return it
      if (typeof item === 'string') {
        return item.trim();
      }
      // If it's an object (old format), convert to string
      if (typeof item === 'object' && item !== null) {
        if (item.title && item.description) {
          return `${item.title}: ${item.description}`;
        }
        // If it has description only
        if (item.description) {
          return item.description;
        }
        // If it has title only
        if (item.title) {
          return item.title;
        }
      }
      // Return as string if it's something else
      return String(item);
    }).filter(item => item && item.trim().length > 0);
  }
  next();
});

// Post-init hook to normalize usage array when loading from database (handles old object format)
medicineSchema.post('init', function(doc) {
  if (doc.usage && Array.isArray(doc.usage)) {
    doc.usage = doc.usage.map(item => {
      // If it's already a string, return it
      if (typeof item === 'string') {
        return item.trim();
      }
      // If it's an object (old format), convert to string
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        if (item.title && item.description) {
          return `${item.title}: ${item.description}`;
        }
        // If it has description only
        if (item.description) {
          return item.description;
        }
        // If it has title only
        if (item.title) {
          return item.title;
        }
      }
      // Return as string if it's something else
      return String(item);
    }).filter(item => item && item.trim().length > 0);
  }
});

module.exports = mongoose.model('Medicine', medicineSchema);

