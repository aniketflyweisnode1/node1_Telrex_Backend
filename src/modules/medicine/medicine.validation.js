const { body } = require('express-validator');

// Add Medicine Validation
exports.addMedicineValidation = [
  // Basic Information
  body('productName')
    .notEmpty()
    .withMessage('Product name is required')
    .isString()
    .withMessage('Product name must be a string')
    .trim(),
  
  body('brand')
    .notEmpty()
    .withMessage('Brand is required')
    .isString()
    .withMessage('Brand must be a string')
    .trim(),
  
  body('originalPrice')
    .notEmpty()
    .withMessage('Original price is required')
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  
  body('salePrice')
    .notEmpty()
    .withMessage('Sale price is required')
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number'),
  
  // Usage - Array of objects
  body('usage')
    .optional()
    .isArray()
    .withMessage('Usage must be an array'),
  
  body('usage.*.title')
    .optional()
    .isString()
    .withMessage('Usage title must be a string')
    .trim(),
  
  body('usage.*.description')
    .optional()
    .isString()
    .withMessage('Usage description must be a string'),
  
  // Description and How it works
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('howItWorks')
    .optional()
    .isString()
    .withMessage('How it works must be a string'),
  
  // Generics - Array of strings
  body('generics')
    .optional()
    .isArray()
    .withMessage('Generics must be an array'),
  
  body('generics.*')
    .optional()
    .isString()
    .withMessage('Each generic must be a string')
    .trim(),
  
  // Dosage Options - Array of objects
  body('dosageOptions')
    .optional()
    .isArray()
    .withMessage('Dosage options must be an array'),
  
  body('dosageOptions.*.name')
    .optional()
    .notEmpty()
    .withMessage('Dosage option name is required')
    .isString()
    .withMessage('Dosage option name must be a string')
    .trim(),
  
  body('dosageOptions.*.priceAdjustment')
    .optional()
    .isFloat()
    .withMessage('Dosage price adjustment must be a number'),
  
  // Quantity Options - Array of objects
  body('quantityOptions')
    .optional()
    .isArray()
    .withMessage('Quantity options must be an array'),
  
  body('quantityOptions.*.name')
    .optional()
    .notEmpty()
    .withMessage('Quantity option name is required')
    .isString()
    .withMessage('Quantity option name must be a string')
    .trim(),
  
  body('quantityOptions.*.priceAdjustment')
    .optional()
    .isFloat()
    .withMessage('Quantity price adjustment must be a number'),
  
  // Medical Information - Paragraphs (text fields)
  body('precautions')
    .optional()
    .isString()
    .withMessage('Precautions must be a string (paragraph)')
    .trim(),
  
  body('sideEffects')
    .optional()
    .isString()
    .withMessage('Side effects must be a string (paragraph)')
    .trim(),
  
  body('drugInteractions')
    .optional()
    .isString()
    .withMessage('Drug interactions must be a string (paragraph)')
    .trim(),
  
  body('indications')
    .optional()
    .isString()
    .withMessage('Indications must be a string (paragraph)')
    .trim(),
  
  // Additional fields
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim(),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('status')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock'])
    .withMessage('Status must be one of: in_stock, low_stock, out_of_stock'),
  
  body('visibility')
    .optional()
    .isBoolean()
    .withMessage('Visibility must be a boolean')
];

