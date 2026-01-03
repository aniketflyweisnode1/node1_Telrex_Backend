const { body, query } = require('express-validator');

// Create contact form query validation
exports.createContactFormQueryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string')
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('services')
    .notEmpty()
    .withMessage('Services is required')
    .isString()
    .withMessage('Services must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Services must be between 2 and 100 characters'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
];

// Update contact form query validation
exports.updateContactFormQueryValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phoneNumber')
    .optional()
    .isString()
    .withMessage('Phone number must be a string')
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('services')
    .optional()
    .isString()
    .withMessage('Services must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Services must be between 2 and 100 characters'),
  
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'archived'])
    .withMessage('Status must be pending, in_progress, resolved, or archived'),
  
  body('response')
    .optional()
    .isString()
    .withMessage('Response must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Response must not exceed 2000 characters')
];

// Get all contact form queries validation
exports.getAllContactFormQueriesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim(),
  
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'archived'])
    .withMessage('Status must be pending, in_progress, resolved, or archived'),
  
  query('services')
    .optional()
    .isString()
    .withMessage('Services must be a string')
    .trim(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'email', 'status'])
    .withMessage('SortBy must be createdAt, name, email, or status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc')
];

