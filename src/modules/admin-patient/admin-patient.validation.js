const { body, query } = require('express-validator');

// Validation for updating patient status
exports.updatePatientStatusValidation = [
  body('isActive')
    .notEmpty()
    .withMessage('isActive is required')
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean()
];

// Validation for query parameters (optional)
exports.getAllPatientsValidation = [
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
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  query('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'firstName', 'lastName'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

