const { query } = require('express-validator');

// Validation for dashboard overview
exports.getDashboardOverviewValidation = [
  query('period')
    .optional()
    .isIn(['all', 'daily', 'today', 'weekly', 'last_7_days', 'monthly', 'this_month', 'last_30_days', 'last_month'])
    .withMessage('Invalid period. Must be one of: all, daily, today, weekly, last_7_days, monthly, this_month, last_30_days, last_month'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ID'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
  query()
    .custom((value, { req }) => {
      // At least one of userId, doctorId, or req.user must be present
      if (req.user && req.user.id) {
        return true; // Authenticated user
      }
      if (req.query.userId || req.query.doctorId) {
        return true; // Query parameters provided
      }
      throw new Error('Either userId or doctorId query parameter is required for public access, or user must be authenticated');
    })
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
    .withMessage('Limit must be between 1 and 100'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ID'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
  query()
    .custom((value, { req }) => {
      // At least one of userId, doctorId, or req.user must be present
      if (req.user && req.user.id) {
        return true; // Authenticated user
      }
      if (req.query.userId || req.query.doctorId) {
        return true; // Query parameters provided
      }
      throw new Error('Either userId or doctorId query parameter is required for public access, or user must be authenticated');
    })
];

// Validation for today's schedule
exports.getTodaysScheduleValidation = [
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ID'),
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
  query()
    .custom((value, { req }) => {
      // At least one of userId, doctorId, or req.user must be present
      if (req.user && req.user.id) {
        return true; // Authenticated user
      }
      if (req.query.userId || req.query.doctorId) {
        return true; // Query parameters provided
      }
      throw new Error('Either userId or doctorId query parameter is required for public access, or user must be authenticated');
    })
];

