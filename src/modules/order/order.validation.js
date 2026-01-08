const { body, param } = require('express-validator');

// Create order validation
exports.createOrderValidation = [
  // Shipping address can be provided as ID or object
  body('shippingAddressId')
    .optional()
    .isMongoId()
    .withMessage('Invalid shipping address ID'),
  
  // Shipping address object validation (if provided instead of ID)
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('Shipping address must be an object'),
  
  body('shippingAddress.fullName')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Full name must be a string'),
  
  body('shippingAddress.firstName')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string'),
  
  body('shippingAddress.lastName')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a string'),
  
  body('shippingAddress.email')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('shippingAddress.phoneNumber')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string'),
  
  body('shippingAddress.phone')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Phone must be a string'),
  
  body('shippingAddress.addressLine1')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isString()
    .withMessage('Address line 1 must be a string'),
  
  body('shippingAddress.streetAddress')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Street address must be a string'),
  
  body('shippingAddress.streetAddress1')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Street address 1 must be a string'),
  
  body('shippingAddress.addressLine2')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Address line 2 must be a string'),
  
  body('shippingAddress.streetAddress2')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Street address 2 must be a string'),
  
  body('shippingAddress.city')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .withMessage('City must be a string'),
  
  body('shippingAddress.state')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('State is required')
    .isString()
    .withMessage('State must be a string'),
  
  body('shippingAddress.postalCode')
    .if(body('shippingAddress').exists())
    .notEmpty()
    .withMessage('Postal code is required')
    .isString()
    .withMessage('Postal code must be a string'),
  
  body('shippingAddress.zipCode')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Zip code must be a string'),
  
  body('shippingAddress.countryCode')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Country code must be a string'),
  
  body('shippingAddress.country')
    .if(body('shippingAddress').exists())
    .optional()
    .isString()
    .withMessage('Country must be a string'),
  
  body('shippingAddress.type')
    .if(body('shippingAddress').exists())
    .optional()
    .isIn(['home', 'work', 'other'])
    .withMessage('Address type must be home, work, or other'),
  
  // Custom validation: Either shippingAddressId or shippingAddress object must be provided
  body().custom((value) => {
    if (!value.shippingAddressId && !value.shippingAddress) {
      throw new Error('Either shippingAddressId or shippingAddress object is required');
    }
    return true;
  }),
  
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
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  
  body('items.*.productId')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  
  body('items.*.productType')
    .if(body('items').exists())
    .optional()
    .isIn(['medication', 'doctors_note', 'other'])
    .withMessage('Product type must be medication, doctors_note, or other'),
  
  body('items.*.medicationName')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Medication name is required for each item')
    .isString()
    .withMessage('Medication name must be a string'),
  
  body('items.*.quantity')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('items.*.unitPrice')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Unit price is required for each item')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  
  body('items.*.totalPrice')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Total price is required for each item')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a non-negative number'),
  
  body('billingAddressSameAsShipping')
    .optional()
    .isBoolean()
    .withMessage('Billing address same as shipping must be a boolean'),
  
  body('billingAddress.firstName')
    .if(body('billingAddressSameAsShipping').equals(false))
    .notEmpty()
    .withMessage('First name is required when billing address is different')
    .isString()
    .withMessage('First name must be a string'),
  
  body('billingAddress.lastName')
    .if(body('billingAddressSameAsShipping').equals(false))
    .notEmpty()
    .withMessage('Last name is required when billing address is different')
    .isString()
    .withMessage('Last name must be a string'),
  
  body('billingAddress.email')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('billingAddress.phoneNumber')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('Phone number must be a string'),
  
  body('billingAddress.phone')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('Phone must be a string'),
  
  body('billingAddress.streetAddress')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('Street address must be a string'),
  
  body('billingAddress.addressLine1')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('Address line 1 must be a string'),
  
  body('billingAddress.streetAddress2')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('Street address 2 must be a string'),
  
  body('billingAddress.addressLine2')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('Address line 2 must be a string'),
  
  body('billingAddress.city')
    .if(body('billingAddressSameAsShipping').equals(false))
    .notEmpty()
    .withMessage('City is required when billing address is different')
    .isString()
    .withMessage('City must be a string'),
  
  body('billingAddress.state')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('State must be a string'),
  
  body('billingAddress.stateProvince')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('State/Province must be a string'),
  
  body('billingAddress.zipCode')
    .if(body('billingAddressSameAsShipping').equals(false))
    .notEmpty()
    .withMessage('Zip/Postal code is required when billing address is different')
    .isString()
    .withMessage('Zip code must be a string'),
  
  body('billingAddress.postalCode')
    .if(body('billingAddressSameAsShipping').equals(false))
    .optional()
    .isString()
    .withMessage('Postal code must be a string'),
  
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
    .withMessage('Notes must be a string'),
  
  body('createAccount')
    .optional()
    .isBoolean()
    .withMessage('Create account must be a boolean')
];

// Delete order item validation
exports.deleteOrderItemValidation = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID')
];

// Save order item validation
exports.saveOrderItemValidation = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID')
];

// Unsave order item validation
exports.unsaveOrderItemValidation = [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID')
];

// Update order item quantity validation
exports.updateOrderItemQuantityValidation = [
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

// Order ID validation
exports.orderIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID')
];

// Cancel order validation
exports.cancelOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Cancellation reason must be between 3 and 500 characters')
];

// Reorder validation
exports.reorderValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID')
];

// Update order notes validation
exports.updateOrderNotesValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];


