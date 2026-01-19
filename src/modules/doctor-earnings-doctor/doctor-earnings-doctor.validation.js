const { body, query } = require('express-validator');

// Get earnings summary validation
exports.getEarningsSummaryValidation = [
  query('period')
    .optional()
    .isIn(['today', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'all'])
    .withMessage('Period must be one of: today, last_7_days, last_30_days, this_month, last_month, all'),
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
      // At least one of userId, doctorId, req.user, or Authorization header must be present
      if (req.user && req.user.id) {
        return true; // Authenticated user
      }
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return true; // Token provided (will be validated by optionalAuth middleware)
      }
      if (req.query.userId || req.query.doctorId) {
        return true; // Query parameters provided
      }
      throw new Error('Either userId or doctorId query parameter is required for public access, or user must be authenticated with a token');
    })
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
    .withMessage('Status must be one of: pending, processing, completed, failed, cancelled'),
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
      // At least one of userId, doctorId, req.user, or Authorization header must be present
      if (req.user && req.user.id) {
        return true; // Authenticated user
      }
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return true; // Token provided (will be validated by optionalAuth middleware)
      }
      if (req.query.userId || req.query.doctorId) {
        return true; // Query parameters provided
      }
      throw new Error('Either userId or doctorId query parameter is required for public access, or user must be authenticated with a token');
    })
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
    .withMessage('Period must be one of: today, last_7_days, last_30_days, this_month, last_month, this_year'),
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
      // At least one of userId, doctorId, req.user, or Authorization header must be present
      if (req.user && req.user.id) {
        return true; // Authenticated user
      }
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return true; // Token provided (will be validated by optionalAuth middleware)
      }
      if (req.query.userId || req.query.doctorId) {
        return true; // Query parameters provided
      }
      throw new Error('Either userId or doctorId query parameter is required for public access, or user must be authenticated with a token');
    })
];

