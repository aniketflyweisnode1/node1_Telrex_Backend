const { query } = require('express-validator');

// Validation for dashboard data
exports.getDashboardDataValidation = [
  query('period')
    .optional()
    .isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_365_days', 'this_month', 'last_month', 'this_year'])
    .withMessage('Invalid period. Must be one of: last_7_days, last_30_days, last_90_days, last_365_days, this_month, last_month, this_year'),
  query('region')
    .optional()
    .isString()
    .withMessage('Region must be a string'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
  query('medicationId')
    .optional()
    .isMongoId()
    .withMessage('Medication ID must be a valid MongoDB ID')
];

// Validation for revenue vs payouts chart
exports.getRevenueVsPayoutsChartValidation = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year between 2020 and 2100')
];

