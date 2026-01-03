const { query, body, param } = require('express-validator');

// Validation for get consultations
exports.getConsultationsValidation = [
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
    .isIn(['pending', 'submitted', 'reviewed', 'draft'])
    .withMessage('Status must be one of: pending, submitted, reviewed, draft'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string')
];

// Validation for get consultation by ID
exports.getConsultationByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid consultation ID')
];

// Validation for update consultation status
exports.updateConsultationStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid consultation ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'submitted', 'reviewed'])
    .withMessage('Status must be one of: draft, submitted, reviewed')
];

