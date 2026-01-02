const { body } = require('express-validator');

// Admin registration validation
exports.adminRegisterValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Country code must be a string')
    .default('+91'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('adminSecretKey')
    .optional()
    .isString()
    .withMessage('Admin secret key must be a string')
];

// Admin login validation
exports.adminLoginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Create sub-admin validation
exports.createSubAdminValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Country code must be a string')
    .default('+91'),
  body('designation')
    .optional()
    .isIn(['Medicine Manager', 'Order Manager', 'Sub-Admin', 'Doctor Manager', 'Patient Manager'])
    .withMessage('Invalid designation'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['sub-admin', 'doctor'])
    .withMessage('Role must be either "sub-admin" or "doctor"')
    .default('sub-admin')
];

// Update sub-admin validation
exports.updateSubAdminValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Country code must be a string'),
  body('designation')
    .optional()
    .isIn(['Medicine Manager', 'Order Manager', 'Sub-Admin', 'Doctor Manager', 'Patient Manager'])
    .withMessage('Invalid designation'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Set permissions validation
exports.setPermissionsValidation = [
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array')
    .notEmpty()
    .withMessage('Permissions array cannot be empty'),
  body('permissions.*.module')
    .notEmpty()
    .withMessage('Module is required for each permission')
    .isIn([
      'dashboard',
      'provider-management',
      'medicine-management',
      'patient-management',
      'prescription-order-management',
      'financial-overview',
      'compliance-security',
      'marketing-notifications',
      'reports-exports'
    ])
    .withMessage('Invalid module name'),
  body('permissions.*.canView')
    .optional()
    .isBoolean()
    .withMessage('canView must be a boolean'),
  body('permissions.*.canCreate')
    .optional()
    .isBoolean()
    .withMessage('canCreate must be a boolean'),
  body('permissions.*.canUpdate')
    .optional()
    .isBoolean()
    .withMessage('canUpdate must be a boolean'),
  body('permissions.*.canDelete')
    .optional()
    .isBoolean()
    .withMessage('canDelete must be a boolean')
];

