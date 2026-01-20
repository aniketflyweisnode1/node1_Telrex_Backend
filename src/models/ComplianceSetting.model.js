const mongoose = require('mongoose');

const complianceSettingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['hipaa', 'gdpr', 'rbac', 'audit_trail'],
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    },
    features: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes
complianceSettingSchema.index({ type: 1 });
complianceSettingSchema.index({ status: 1 });
complianceSettingSchema.index({ isActive: 1 });

module.exports = mongoose.model('ComplianceSetting', complianceSettingSchema);

