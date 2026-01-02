const { body } = require('express-validator');

// Process checkout validation
exports.processCheckoutValidation = [
  body('shippingAddressId')
    .notEmpty()
    .withMessage('Shipping address ID is required')
    .isMongoId()
    .withMessage('Invalid shipping address ID'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['card', 'upi', 'netbanking', 'wallet', 'cod'])
    .withMessage('Invalid payment method'),
  
  body('billingAddressSameAsShipping')
    .optional()
    .isBoolean()
    .withMessage('Billing address same as shipping must be a boolean'),
  
  // Conditional validation: if billingAddressSameAsShipping is false, billing address is required
  body('billingAddress')
    .if((value, { req }) => req.body.billingAddressSameAsShipping === false)
    .notEmpty()
    .withMessage('Billing address is required when different from shipping address'),
  
  // Billing address fields (required if billingAddressSameAsShipping is false)
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
    .isNumeric()
    .withMessage('Shipping charges must be a number')
    .isFloat({ min: 0 })
    .withMessage('Shipping charges must be greater than or equal to 0'),
  
  body('orderComment')
    .optional()
    .isString()
    .withMessage('Order comment must be a string'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string'),
  
  body('cardDetails.cardNumber')
    .optional()
    .isString()
    .withMessage('Card number must be a string'),
  
  body('cardDetails.expiryDate')
    .optional()
    .isString()
    .withMessage('Expiry date must be a string'),
  
  body('cardDetails.cvv')
    .optional()
    .isString()
    .withMessage('CVV must be a string'),
  
  body('cardDetails.cardHolderName')
    .optional()
    .isString()
    .withMessage('Card holder name must be a string')
];

