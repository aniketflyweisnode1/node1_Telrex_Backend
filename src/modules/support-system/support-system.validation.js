const { body, query, param } = require('express-validator');

// Create support query validation
exports.createSupportQueryValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  body('subject')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject must not exceed 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('category')
    .optional()
    .isIn(['general', 'order', 'payment', 'refund', 'technical', 'medication', 'prescription', 'other'])
    .withMessage('Category must be one of: general, order, payment, refund, technical, medication, prescription, other'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must not exceed 50 characters')
];

// Get support queries validation
exports.getSupportQueriesValidation = [
  query('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: open, in_progress, resolved, closed'),
  query('category')
    .optional()
    .isIn(['general', 'order', 'payment', 'refund', 'technical', 'medication', 'prescription', 'other'])
    .withMessage('Category must be one of: general, order, payment, refund, technical, medication, prescription, other'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Support query ID validation
exports.supportQueryIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Support query ID must be a valid MongoDB ID')
];

// Send message validation
exports.sendMessageValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')
];

// Edit message validation
exports.editMessageValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')
];

// Message ID validation
exports.messageIdValidation = [
  param('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .isString()
    .trim()
];

