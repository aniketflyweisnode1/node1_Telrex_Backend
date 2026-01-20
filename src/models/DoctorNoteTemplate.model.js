const mongoose = require('mongoose');

const doctorNoteTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Doctor's Note"
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 49.99
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    shortDescription: {
      type: String,
      trim: true
    },
    coverageDays: {
      type: Number,
      default: 3,
      min: 1,
      max: 30
    },
    image: {
      url: {
        type: String,
        trim: true
      },
      alt: {
        type: String,
        trim: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    visibility: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    order: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Indexes
doctorNoteTemplateSchema.index({ isActive: 1, visibility: 1 });
doctorNoteTemplateSchema.index({ order: 1 });

module.exports = mongoose.model('DoctorNoteTemplate', doctorNoteTemplateSchema);

