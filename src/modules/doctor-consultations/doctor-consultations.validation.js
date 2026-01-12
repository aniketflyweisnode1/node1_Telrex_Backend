const { query, body, param } = require('express-validator');

// Validation for get all consultations (no doctor filter - for admin)
exports.getAllConsultationsValidation = [
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
    .withMessage('Search must be a string'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID')
];

// Validation for get consultations by doctor (filters by specific doctor)
exports.getConsultationsByDoctorValidation = [
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
    .withMessage('Search must be a string'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ID'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
  query()
    .custom((value, { req }) => {
      // At least one of userId, doctorId, or req.user must be present
      if (req.user && req.user.id) {
        return true; // Authenticated user
      }
      if (req.query.userId || req.query.doctorId) {
        return true; // Query parameters provided
      }
      throw new Error('Either userId or doctorId query parameter is required for public access, or user must be authenticated');
    })
];

// Validation for get consultations by doctor ID (path parameter)
exports.getConsultationsByDoctorIdValidation = [
  param('doctorId')
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
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
    .withMessage('Invalid consultation ID'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ID'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID')
  // No custom validation - consultation can be accessed by ID alone (public)
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

