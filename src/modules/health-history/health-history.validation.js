const { body, query, param } = require('express-validator');

// Validation for get health histories
exports.getHealthHistoriesValidation = [
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

// Validation for get health history by ID
exports.getHealthHistoryByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  param('healthHistoryId')
    .isMongoId()
    .withMessage('Health history ID must be a valid MongoDB ID')
];

// Validation for create health history
exports.createHealthHistoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  body('doctor')
    .notEmpty()
    .withMessage('Doctor is required')
    .isMongoId()
    .withMessage('Doctor must be a valid MongoDB ID'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters')
];

// Validation for update health history
exports.updateHealthHistoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  param('healthHistoryId')
    .isMongoId()
    .withMessage('Health history ID must be a valid MongoDB ID'),
  body('doctor')
    .optional()
    .isMongoId()
    .withMessage('Doctor must be a valid MongoDB ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters')
];

// Validation for delete health history
exports.deleteHealthHistoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  param('healthHistoryId')
    .isMongoId()
    .withMessage('Health history ID must be a valid MongoDB ID')
];

