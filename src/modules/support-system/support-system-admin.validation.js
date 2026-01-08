const { body, query, param } = require('express-validator');

// Get all support queries validation (Admin)
exports.getAllSupportQueriesValidation = [
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
  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned to must be a valid MongoDB ID'),
  query('patientId')
    .optional()
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search term must not exceed 200 characters'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Support query ID validation (Admin)
exports.supportQueryIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Support query ID must be a valid MongoDB ID')
];

// Reply to support query validation (Admin)
exports.replyToSupportQueryValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')
];

// Assign support query validation (Admin)
exports.assignSupportQueryValidation = [
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned to must be a valid MongoDB ID'),
  body('assignedToId')
    .optional()
    .isMongoId()
    .withMessage('Assigned to ID must be a valid MongoDB ID'),
  // Custom validation to ensure at least one is provided
  body().custom((value) => {
    if (!value.assignedTo && !value.assignedToId) {
      throw new Error('Either assignedTo or assignedToId is required');
    }
    return true;
  })
];

// Update support query status validation (Admin)
exports.updateSupportQueryStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: open, in_progress, resolved, closed'),
  body('resolutionNotes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resolution notes must not exceed 1000 characters')
];

// Edit message validation (Admin)
exports.editMessageValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')
];

// Message ID validation (Admin)
exports.messageIdValidation = [
  param('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .isString()
    .trim()
];

