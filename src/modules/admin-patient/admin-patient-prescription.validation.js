const { body, query, param } = require('express-validator');

// Validation for get prescriptions
exports.getPrescriptionsValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string')
];

// Validation for get prescription by ID
exports.getPrescriptionByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  param('prescriptionId')
    .isMongoId()
    .withMessage('Prescription ID must be a valid MongoDB ID')
];

// Validation for create prescription
exports.createPrescriptionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  body('doctor')
    .optional()
    .isMongoId()
    .withMessage('Doctor must be a valid MongoDB ID'),
  body('medicine')
    .notEmpty()
    .withMessage('Medicine is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Medicine must be between 1 and 200 characters'),
  body('brand')
    .notEmpty()
    .withMessage('Brand is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Brand must be between 1 and 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled')
];

// Validation for update prescription
exports.updatePrescriptionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  param('prescriptionId')
    .isMongoId()
    .withMessage('Prescription ID must be a valid MongoDB ID'),
  body('doctor')
    .optional()
    .isMongoId()
    .withMessage('Doctor must be a valid MongoDB ID'),
  body('medicine')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Medicine must be between 1 and 200 characters'),
  body('brand')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Brand must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled')
];

// Validation for delete prescription
exports.deletePrescriptionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  param('prescriptionId')
    .isMongoId()
    .withMessage('Prescription ID must be a valid MongoDB ID')
];

