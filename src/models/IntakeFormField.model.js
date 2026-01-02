const mongoose = require('mongoose');

const intakeFormFieldSchema = new mongoose.Schema(
  {
    fieldLabel: {
      type: String,
      required: true,
      trim: true
    },
    fieldType: {
      type: String,
      required: true,
      enum: [
        'text',
        'textarea',
        'email',
        'number',
        'tel',
        'date',
        'time',
        'datetime',
        'select',
        'multiselect',
        'radio',
        'checkbox',
        'file',
        'url'
      ],
      default: 'text'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      trim: true
    },
    helpText: {
      type: String,
      trim: true
    },
    options: [{
      label: {
        type: String,
        required: true,
        trim: true
      },
      value: {
        type: String,
        required: true,
        trim: true
      }
    }],
    validation: {
      minLength: Number,
      maxLength: Number,
      min: Number,
      max: Number,
      pattern: String, // Regex pattern
      customMessage: String
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    section: {
      type: String,
      enum: ['basic_information', 'emergency_contact', 'medical_questions', 'custom'],
      default: 'custom'
    }
  },
  { timestamps: true }
);

// Index for ordering
intakeFormFieldSchema.index({ order: 1, isActive: 1 });
intakeFormFieldSchema.index({ section: 1 });

module.exports = mongoose.model('IntakeFormField', intakeFormFieldSchema);

