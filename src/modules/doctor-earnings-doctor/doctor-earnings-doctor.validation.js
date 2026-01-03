const { body, query } = require('express-validator');

// Get earnings summary validation
exports.getEarningsSummaryValidation = [
  query('period')
    .optional()
    .isIn(['today', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'all'])
    .withMessage('Period must be one of: today, last_7_days, last_30_days, this_month, last_month, all')
];

// Get payout requests validation
exports.getPayoutRequestsValidation = [
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
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Status must be one of: pending, processing, completed, failed, cancelled')
];

// Create payout request validation
exports.createPayoutRequestValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Get reports & analytics validation
exports.getReportsAndAnalyticsValidation = [
  query('period')
    .optional()
    .isIn(['today', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year'])
    .withMessage('Period must be one of: today, last_7_days, last_30_days, this_month, last_month, this_year')
];

