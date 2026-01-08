const { body, query, param } = require('express-validator');

// Create help desk query validation (Public)
exports.createHelpDeskQueryValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message must not exceed 2000 characters'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('source')
    .optional()
    .isIn(['website', 'mobile_app', 'api', 'other'])
    .withMessage('Source must be one of: website, mobile_app, api, other')
];

// Get all help desk queries validation (Admin)
exports.getAllHelpDeskQueriesValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: pending, in_progress, resolved, closed'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  query('email')
    .optional()
    .isString()
    .trim()
    .withMessage('Email search must be a string'),
  
  query('firstName')
    .optional()
    .isString()
    .trim()
    .withMessage('First name search must be a string'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('source')
    .optional()
    .isIn(['website', 'mobile_app', 'api', 'other'])
    .withMessage('Source must be one of: website, mobile_app, api, other'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status', 'priority', 'email', 'firstName'])
    .withMessage('Sort by must be one of: createdAt, updatedAt, status, priority, email, firstName'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

// Help desk query ID validation
exports.helpDeskQueryIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Help desk query ID must be a valid MongoDB ID')
];

// Update help desk query validation (Admin)
exports.updateHelpDeskQueryValidation = [
  body('firstName')
    .optional()
    .isString()
    .withMessage('First name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message must not exceed 2000 characters'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: pending, in_progress, resolved, closed'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('response')
    .optional()
    .isString()
    .withMessage('Response must be a string')
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Response must not exceed 5000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be a string with max 50 characters'),
  
  body('source')
    .optional()
    .isIn(['website', 'mobile_app', 'api', 'other'])
    .withMessage('Source must be one of: website, mobile_app, api, other')
];

