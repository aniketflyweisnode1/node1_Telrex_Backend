const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: [
      'dashboard',
      'provider-management',
      'medicine-management',
      'patient-management',
      'prescription-order-management',
      'financial-overview',
      'compliance-security',
      'marketing-notifications',
      'reports-exports'
    ]
  },
  canView: { type: Boolean, default: false },
  canCreate: { type: Boolean, default: false },
  canUpdate: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false }
}, { _id: false });

const subAdminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    designation: {
      type: String,
      required: true,
      enum: ['Medicine Manager', 'Order Manager', 'Sub-Admin', 'Doctor Manager', 'Patient Manager'],
      default: 'Sub-Admin'
    },
    permissions: [permissionSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster queries
subAdminSchema.index({ user: 1 });
subAdminSchema.index({ isActive: 1 });
subAdminSchema.index({ designation: 1 });

// Virtual for active permissions count
subAdminSchema.virtual('activePermissionsCount').get(function() {
  if (!this.permissions || this.permissions.length === 0) return 0;
  return this.permissions.filter(p => p.canView || p.canCreate || p.canUpdate || p.canDelete).length;
});

// Method to get total modules count
subAdminSchema.methods.getTotalModules = function() {
  return 9; // Total number of modules
};

// Method to check if sub-admin has permission for a module
subAdminSchema.methods.hasPermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module);
  if (!permission) return false;
  
  switch (action) {
    case 'view': return permission.canView;
    case 'create': return permission.canCreate;
    case 'update': return permission.canUpdate;
    case 'delete': return permission.canDelete;
    default: return false;
  }
};

module.exports = mongoose.model('SubAdmin', subAdminSchema);

