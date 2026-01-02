const { body } = require('express-validator');

exports.addPaymentMethodValidation = [
  body('type')
    .isIn(['card', 'upi', 'netbanking', 'wallet'])
    .withMessage('Invalid payment method type'),
  
  // Card validation
  body('cardNumber')
    .if(body('type').equals('card'))
    .notEmpty()
    .withMessage('Card number is required for card type')
    .isLength({ min: 13, max: 19 })
    .withMessage('Card number must be between 13 and 19 digits'),
  
  body('expiryDate')
    .if(body('type').equals('card'))
    .notEmpty()
    .withMessage('Expiry date is required for card type')
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .withMessage('Expiry date must be in MM/YY format'),
  
  body('cardType')
    .if(body('type').equals('card'))
    .isIn(['credit', 'debit'])
    .withMessage('Card type must be credit or debit'),
  
  body('cardHolderName')
    .if(body('type').equals('card'))
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Card holder name must be between 2 and 50 characters'),
  
  body('securityCode')
    .if(body('type').equals('card'))
    .optional()
    .isLength({ min: 3, max: 4 })
    .withMessage('Security code must be 3 or 4 digits'),
  
  body('bankName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Bank name must be between 2 and 50 characters'),
  
  // UPI validation
  body('upiId')
    .if(body('type').equals('upi'))
    .notEmpty()
    .withMessage('UPI ID is required for UPI type')
    .matches(/^[\w\.-]+@[\w\.-]+$/)
    .withMessage('Invalid UPI ID format'),
  
  // Wallet validation
  body('walletType')
    .if(body('type').equals('wallet'))
    .isIn(['paytm', 'phonepe', 'googlepay', 'amazonpay', 'other'])
    .withMessage('Invalid wallet type'),
  
  body('walletId')
    .if(body('type').equals('wallet'))
    .notEmpty()
    .withMessage('Wallet ID is required for wallet type'),
  
  // Netbanking validation
  body('bankAccountNumber')
    .if(body('type').equals('netbanking'))
    .notEmpty()
    .withMessage('Bank account number is required for netbanking type'),
  
  body('ifscCode')
    .if(body('type').equals('netbanking'))
    .notEmpty()
    .withMessage('IFSC code is required for netbanking type')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
];

exports.updatePaymentMethodValidation = [
  body('expiryDate')
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .withMessage('Expiry date must be in MM/YY format'),
  
  body('cardType')
    .optional()
    .isIn(['credit', 'debit'])
    .withMessage('Card type must be credit or debit'),
  
  body('bankName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Bank name must be between 2 and 50 characters'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
];

