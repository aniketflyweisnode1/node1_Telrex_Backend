const { body, query, param } = require('express-validator');

// Get refills validation
exports.getRefillsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, approved, rejected, completed, cancelled'),
  query('prescriptionId')
    .optional()
    .isMongoId()
    .withMessage('Prescription ID must be a valid MongoDB ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Request refill validation
exports.requestRefillValidation = [
  body('prescriptionId')
    .notEmpty()
    .withMessage('Prescription ID is required')
    .isMongoId()
    .withMessage('Prescription ID must be a valid MongoDB ID'),
  body('medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('medications.*.medicationName')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Medication name is required'),
  body('medications.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('maxRefills')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Max refills must be between 0 and 10'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Refill ID validation
exports.refillIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Refill ID must be a valid MongoDB ID')
];

