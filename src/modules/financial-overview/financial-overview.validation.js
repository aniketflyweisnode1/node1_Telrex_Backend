const { query } = require('express-validator');

// Validation for financial overview query parameters
exports.getFinancialOverviewValidation = [
  query('period')
    .optional()
    .isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_365_days', 'this_month', 'last_month', 'this_year'])
    .withMessage('Invalid period. Must be one of: last_7_days, last_30_days, last_90_days, last_365_days, this_month, last_month, this_year')
];

// Validation for revenue chart query parameters
exports.getRevenueChartValidation = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year between 2020 and 2100')
];

// Validation for recent transactions query parameters
exports.getRecentTransactionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['all', 'consultation', 'pharmacy', 'payouts'])
    .withMessage('Type must be one of: all, consultation, pharmacy, payouts'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

