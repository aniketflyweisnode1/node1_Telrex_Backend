const { query } = require('express-validator');

// Validation for dashboard overview
exports.getDashboardOverviewValidation = [
  query('period')
    .optional()
    .isIn(['all', 'today', 'last_7_days', 'last_30_days', 'this_month', 'last_month'])
    .withMessage('Invalid period. Must be one of: all, today, last_7_days, last_30_days, this_month, last_month')
];

// Validation for recent consultations
exports.getRecentConsultationsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for today's schedule
exports.getTodaysScheduleValidation = [
  // No validation needed for now, but can be extended
];

