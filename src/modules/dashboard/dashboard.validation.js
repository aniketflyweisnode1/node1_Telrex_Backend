const { query } = require('express-validator');
const mongoose = require('mongoose');

// Validation for dashboard data
exports.getDashboardDataValidation = [
  query('period')
    .optional()
    .isIn(['today', 'last_7_days', 'last_30_days', 'last_90_days', 'last_365_days', 'this_month', 'last_month', 'this_year'])
    .withMessage('Invalid period. Must be one of: today, last_7_days, last_30_days, last_90_days, last_365_days, this_month, last_month, this_year'),
  query('region')
    .optional()
    .custom((value) => {
      if (value === 'all' || value === '' || !value) return true;
      return typeof value === 'string';
    })
    .withMessage('Region must be a string or "all"'),
  query('doctorId')
    .optional()
    .custom((value) => {
      if (value === 'all' || value === '' || !value) return true;
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Doctor ID must be a valid MongoDB ID or "all"'),
  query('medicationId')
    .optional()
    .custom((value) => {
      if (value === 'all' || value === '' || !value) return true;
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Medication ID must be a valid MongoDB ID or "all"'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for revenue vs payouts chart
exports.getRevenueVsPayoutsChartValidation = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be a valid year between 2020 and 2100')
];

