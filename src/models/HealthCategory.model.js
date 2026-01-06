const mongoose = require('mongoose');

const healthCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    icon: {
      type: String, // Icon URL or icon name
      trim: true
    },
    // Types/Chronic conditions under this category (e.g., Asthma, Dry Eye)
    types: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      slug: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      icon: {
        type: String,
        trim: true
      },
      order: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Generate slug from name
healthCategorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    // Convert to lowercase and replace spaces/special chars with hyphens
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Generate slug for types if not provided
  if (this.types && this.types.length > 0) {
    this.types.forEach(type => {
      if (!type.slug && type.name) {
        type.slug = type.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
    });
  }
  
  next();
});

// Indexes
healthCategorySchema.index({ slug: 1, isActive: 1 });
healthCategorySchema.index({ order: 1 });
healthCategorySchema.index({ 'types.slug': 1 });

module.exports = mongoose.model('HealthCategory', healthCategorySchema);

