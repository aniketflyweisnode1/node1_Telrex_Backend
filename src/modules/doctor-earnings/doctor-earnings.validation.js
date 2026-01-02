const { body, query } = require('express-validator');

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
  query('specialty')
    .optional()
    .isIn([
      'General Practice',
      'Cardiology',
      'Pediatrics',
      'Dermatology',
      'Orthopedics',
      'Neurology',
      'Psychiatry',
      'Oncology',
      'Gynecology',
      'Urology',
      'Ophthalmology',
      'ENT',
      'Pulmonology',
      'Gastroenterology',
      'Endocrinology',
      'Rheumatology',
      'Other'
    ])
    .withMessage('Invalid specialty'),
  query('sortBy')
    .optional()
    .isIn(['totalEarnings', 'consultations', 'feesPerHour', 'availableEarnings'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Validation for processing payout
exports.processPayoutValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('bankAccount.accountHolder')
    .notEmpty()
    .withMessage('Account holder name is required')
    .isString()
    .withMessage('Account holder must be a string')
    .trim(),
  body('bankAccount.bankName')
    .notEmpty()
    .withMessage('Bank name is required')
    .isString()
    .withMessage('Bank name must be a string')
    .trim(),
  body('bankAccount.accountNumber')
    .notEmpty()
    .withMessage('Account number is required')
    .isString()
    .withMessage('Account number must be a string')
    .trim(),
  body('bankAccount.routingNumber')
    .notEmpty()
    .withMessage('Routing number is required')
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
  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
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

