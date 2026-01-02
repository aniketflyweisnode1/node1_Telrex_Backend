const { body } = require('express-validator');

// Add to cart validation
exports.addToCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isString()
    .withMessage('Product ID must be a string'),
  
  body('productName')
    .notEmpty()
    .withMessage('Product name is required')
    .isString()
    .withMessage('Product name must be a string'),
  
  body('unitPrice')
    .notEmpty()
    .withMessage('Unit price is required')
    .isNumeric()
    .withMessage('Unit price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be greater than or equal to 0'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('productImage')
    .optional()
    .isString()
    .withMessage('Product image must be a string'),
  
  body('productType')
    .optional()
    .isIn(['medication', 'doctors_note', 'other'])
    .withMessage('Product type must be medication, doctors_note, or other')
];

// Apply coupon validation
exports.applyCouponValidation = [
  body('couponCode')
    .notEmpty()
    .withMessage('Coupon code is required')
    .isString()
    .withMessage('Coupon code must be a string')
    .trim()
];

// Update quantity validation
exports.updateQuantityValidation = [
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

