const { body, param } = require('express-validator');

// Create order validation
exports.createOrderValidation = [
  body('shippingAddressId')
    .notEmpty()
    .withMessage('Shipping address ID is required')
    .isMongoId()
    .withMessage('Invalid shipping address ID'),
  
  body('createFromCart')
    .optional()
    .isBoolean()
    .withMessage('createFromCart must be a boolean'),
  
  body('prescriptionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid prescription ID'),
  
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  
  body('items.*.medicationName')
    .optional()
    .isString()
    .withMessage('Medication name must be a string'),
  
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  
  body('items.*.totalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total price must be a non-negative number'),
  
  body('billingAddressSameAsShipping')
    .optional()
    .isBoolean()
    .withMessage('Billing address same as shipping must be a boolean'),
  
  body('billingAddress.firstName')
    .optional()
    .isString()
    .withMessage('First name must be a string'),
  
  body('billingAddress.lastName')
    .optional()
    .isString()
    .withMessage('Last name must be a string'),
  
  body('billingAddress.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('billingAddress.phoneNumber')
    .optional()
    .isString()
    .withMessage('Phone number must be a string'),
  
  body('billingAddress.streetAddress')
    .optional()
    .isString()
    .withMessage('Street address must be a string'),
  
  body('billingAddress.city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
  
  body('billingAddress.state')
    .optional()
    .isString()
    .withMessage('State must be a string'),
  
  body('billingAddress.zipCode')
    .optional()
    .isString()
    .withMessage('Zip code must be a string'),
  
  body('shippingCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping charges must be a non-negative number'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number'),
  
  body('orderComment')
    .optional()
    .isString()
    .withMessage('Order comment must be a string'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
];

// Update item quantity validation
exports.updateItemQuantityValidation = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

