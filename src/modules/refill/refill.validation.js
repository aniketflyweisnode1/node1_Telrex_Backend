const { body, query, param } = require('express-validator');

// Create refill validation
exports.createRefillValidation = [
  body('medicineId')
    .notEmpty()
    .withMessage('Medicine ID is required')
    .isMongoId()
    .withMessage('Medicine ID must be a valid MongoDB ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled', 'skipped'])
    .withMessage('Status must be one of: pending, approved, rejected, completed, cancelled, skipped'),
  body('dosage')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Dosage must not exceed 255 characters'),
  body('frequency')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Frequency must not exceed 255 characters'),
  body('instructions')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions must not exceed 500 characters'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('totalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('autoRefill')
    .optional()
    .isBoolean()
    .withMessage('Auto refill must be a boolean (true/false)')
    .toBoolean(), // Convert string "true"/"false" to boolean - for "Automatically get my refill(s) from TeleRx!" toggle
  body('autoRefillFrequency')
    .optional()
    .isIn(['monthly', 'quarterly', 'biannual', 'annual'])
    .withMessage('Auto refill frequency must be one of: monthly, quarterly, biannual, annual'),
  body('maxRefills')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Max refills must be between 0 and 10'),
  body('medicationName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Medication name must not exceed 255 characters')
];

// Get refills validation
exports.getRefillsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled', 'skipped'])
    .withMessage('Status must be one of: pending, approved, rejected, completed, cancelled, skipped'),
  query('medicineId')
    .optional()
    .isMongoId()
    .withMessage('Medicine ID must be a valid MongoDB ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Refill ID validation
exports.refillIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Refill ID must be a valid MongoDB ID')
];

// Update refill validation
exports.updateRefillValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled', 'skipped'])
    .withMessage('Status must be one of: pending, approved, rejected, completed, cancelled, skipped'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('dosage')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Dosage must not exceed 255 characters'),
  body('frequency')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Frequency must not exceed 255 characters'),
  body('instructions')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions must not exceed 500 characters'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('autoRefill')
    .optional()
    .isBoolean()
    .withMessage('Auto refill must be a boolean'),
  body('autoRefillFrequency')
    .optional()
    .isIn(['monthly', 'quarterly', 'biannual', 'annual'])
    .withMessage('Auto refill frequency must be one of: monthly, quarterly, biannual, annual'),
  body('maxRefills')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Max refills must be between 0 and 10'),
  body('rejectionReason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters'),
  body('skipReason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Skip reason must not exceed 500 characters')
];

// Create order from refill validation (checkout)
exports.createOrderFromRefillValidation = [
  // Selected refill IDs (multiple refills can be selected for checkout)
  body('selectedRefillIds')
    .notEmpty()
    .withMessage('At least one refill ID must be selected')
    .isArray({ min: 1 })
    .withMessage('Selected refill IDs must be an array with at least one item'),
  body('selectedRefillIds.*')
    .isMongoId()
    .withMessage('Each selected refill ID must be a valid MongoDB ID'),
  // Shipping address validation (according to address form)
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isObject()
    .withMessage('Shipping address must be an object'),
  body('shippingAddress.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('shippingAddress.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('shippingAddress.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('shippingAddress.emailAddress')
    .optional()
    .isEmail()
    .withMessage('Invalid email address format')
    .normalizeEmail(),
  body('shippingAddress.streetAddress1')
    .optional()
    .isString()
    .trim()
    .withMessage('Street address 1 must be a string'),
  body('shippingAddress.streetAddress2')
    .optional()
    .isString()
    .trim()
    .withMessage('Street address 2 must be a string'),
  body('shippingAddress.addressLine1')
    .optional()
    .isString()
    .trim()
    .withMessage('Address line 1 must be a string'),
  body('shippingAddress.addressLine2')
    .optional()
    .isString()
    .trim()
    .withMessage('Address line 2 must be a string'),
  body('shippingAddress.state')
    .optional()
    .isString()
    .trim()
    .withMessage('State must be a string'),
  body('shippingAddress.stateProvince')
    .optional()
    .isString()
    .trim()
    .withMessage('State/Province must be a string'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters'),
  body('shippingAddress.zipCode')
    .optional()
    .isString()
    .trim()
    .withMessage('Zip/Postal code must be a string'),
  body('shippingAddress.postalCode')
    .optional()
    .isString()
    .trim()
    .withMessage('Postal code must be a string'),
  body('shippingAddress.zip')
    .optional()
    .isString()
    .trim()
    .withMessage('Zip code must be a string'),
  body('shippingAddress.phone')
    .optional()
    .isString()
    .trim()
    .withMessage('Phone must be a string'),
  body('shippingAddress.phoneNumber')
    .optional()
    .isString()
    .trim()
    .withMessage('Phone number must be a string'),
  body('shippingAddress.countryCode')
    .optional()
    .isString()
    .trim()
    .withMessage('Country code must be a string'),
  body('shippingAddress.country')
    .optional()
    .isString()
    .trim()
    .withMessage('Country must be a string'),
  // Checkbox fields (billing address is set internally from shipping if checkbox is checked)
  body('billingAddressSameAsShipping')
    .optional()
    .isBoolean()
    .withMessage('Billing address same as shipping must be a boolean')
    .toBoolean(),
  body('createAccount')
    .optional()
    .isBoolean()
    .withMessage('Create account must be a boolean')
    .toBoolean(),
  // Order details
  body('shippingCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping charges must be a positive number'),
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a positive number'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('orderComment')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Order comment must not exceed 1000 characters')
];

// Skip refill validation
exports.skipRefillValidation = [
  body('skipReason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Skip reason must not exceed 500 characters'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Get refill orders validation
exports.getRefillOrdersValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled, returned'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Payment status must be one of: pending, paid, failed, refunded'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Refill order ID validation
exports.refillOrderIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Order ID must be a valid MongoDB ID')
];
