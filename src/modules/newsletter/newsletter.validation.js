const { body, query, param } = require('express-validator');

// Subscribe to newsletter validation
exports.subscribeNewsletterValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Unsubscribe from newsletter validation
exports.unsubscribeNewsletterValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Get all newsletter subscriptions validation (admin)
exports.getAllNewsletterSubscriptionsValidation = [
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
    .isIn(['subscribed', 'unsubscribed', 'pending'])
    .withMessage('Status must be subscribed, unsubscribed, or pending'),
  
  query('sortBy')
    .optional()
    .isIn(['subscribedAt', 'email', 'status'])
    .withMessage('SortBy must be subscribedAt, email, or status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc')
];

// Newsletter subscription ID validation
exports.newsletterIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Newsletter subscription ID must be a valid MongoDB ID')
];

