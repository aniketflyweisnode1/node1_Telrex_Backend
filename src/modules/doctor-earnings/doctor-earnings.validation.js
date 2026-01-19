const { body, query } = require('express-validator');
const mongoose = require('mongoose');

// Validation for getting doctor earnings summary
exports.getDoctorEarningsSummaryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string'),
  query('specialty')
    .optional()
    .custom((value) => {
      // Accept MongoDB ObjectId or empty string
      if (!value || value === '') return true;
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Specialty must be a valid MongoDB ObjectId'),
  query('sortBy')
    .optional()
    .isIn(['totalEarnings', 'consultations', 'feesPerHour', 'availableEarnings', 'doctor.fullName', 'specialty.name'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Validation for processing payout (Admin Panel - Process Payout Modal)
exports.processPayoutValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  // Bank account is optional if doctor has bank account in profile
  body('bankAccount.accountHolder')
    .optional()
    .isString()
    .withMessage('Account holder name must be a string')
    .trim(),
  body('bankAccount.bankName')
    .optional()
    .isString()
    .withMessage('Bank name must be a string')
    .trim(),
  body('bankAccount.accountNumber')
    .optional()
    .isString()
    .withMessage('Account number must be a string')
    .trim(),
  body('bankAccount.routingNumber')
    .optional()
    .isString()
    .withMessage('Routing number must be a string')
    .trim(),
  body('bankAccount.accountType')
    .optional()
    .isIn(['checking', 'savings'])
    .withMessage('Account type must be checking or savings'),
  body('payoutMethod')
    .optional()
    .isIn(['bank_transfer', 'wire_transfer', 'ach', 'check'])
    .withMessage('Invalid payout method'),
  body('payoutGateway')
    .optional()
    .isIn(['stripe', 'paypal', 'manual'])
    .withMessage('Invalid payout gateway'),
  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code (e.g., USD)'),
  body('autoComplete')
    .optional()
    .isBoolean()
    .withMessage('Auto complete must be a boolean'),
  body('transactionId')
    .optional()
    .isString()
    .withMessage('Transaction ID must be a string')
    .trim(),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Validation for updating payout status
exports.updatePayoutStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid payout status'),
  body('transactionId')
    .optional()
    .isString()
    .withMessage('Transaction ID must be a string'),
  body('failureReason')
    .optional()
    .isString()
    .withMessage('Failure reason must be a string')
];

