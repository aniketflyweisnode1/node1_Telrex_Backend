const { query, param } = require('express-validator');

// Validation for getting transaction history
exports.getTransactionHistoryValidation = [
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
    .isIn(['pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'])
    .withMessage('Status must be one of: pending, processing, success, failed, refunded, cancelled'),
  query('paymentMethod')
    .optional()
    .isIn(['card', 'upi', 'netbanking', 'wallet'])
    .withMessage('Payment method must be one of: card, upi, netbanking, wallet'),
  query('paymentGateway')
    .optional()
    .isIn(['stripe'])
    .withMessage('Payment gateway must be stripe'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'amount', 'paymentStatus'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('type')
    .optional()
    .isIn(['Refill', 'Excuse', 'Shopping'])
    .withMessage('Transaction type must be one of: Refill, Excuse, Shopping'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number')
];

// Validation for getting transaction by ID
exports.getTransactionByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  param('transactionId')
    .isMongoId()
    .withMessage('Transaction ID must be a valid MongoDB ID')
];

