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
  
  // Usage - Array of strings
  body('usage')
    .optional()
    .isArray()
    .withMessage('Usage must be an array'),
  
  body('usage.*')
    .optional()
    .isString()
    .withMessage('Each usage item must be a string')
    .trim(),
  
  // Description and How it works
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('howItWorks')
    .optional()
    .isString()
    .withMessage('How it works must be a string'),
  
  // Generics - Array of strings (keeping original format)
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
    .withMessage('Visibility must be a boolean'),
  
  // Health Category and Type relationships
  // Note: If healthTypeSlug is provided, healthCategory MUST be provided
  // healthTypeSlug must be one of the types within the selected healthCategory
  body('healthCategory')
    .optional()
    .isMongoId()
    .withMessage('Health category ID must be a valid MongoDB ID'),
  
  body('healthTypeSlug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Health type slug must be lowercase alphanumeric with hyphens')
    .custom((value, { req }) => {
      // If healthTypeSlug is provided, healthCategory must also be provided
      if (value && !req.body.healthCategory) {
        throw new Error('Health category is required when health type slug is provided');
      }
      return true;
    }),
  
  // Admin managed flags
  body('isTrendy')
    .optional()
    .custom((value) => {
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string' && (value === 'true' || value === 'false')) return true;
      throw new Error('isTrendy must be a boolean or string "true"/"false"');
    })
    .withMessage('isTrendy must be a boolean'),
  
  body('isBestOffer')
    .optional()
    .custom((value) => {
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string' && (value === 'true' || value === 'false')) return true;
      throw new Error('isBestOffer must be a boolean or string "true"/"false"');
    })
    .withMessage('isBestOffer must be a boolean'),
  
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  
  // Markup field
  body('markup')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Markup must be a non-negative number')
];

// Medicine ID validation (for route params)
exports.medicineIdValidation = [
  // This is handled by route param validation, but we can add custom validation if needed
];

// Update stock and status validation
exports.updateStockStatusValidation = [
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('status')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock', 'discontinued'])
    .withMessage('Status must be one of: in_stock, low_stock, out_of_stock, discontinued')
];

// Update visibility validation
exports.updateVisibilityValidation = [
  body('visibility')
    .notEmpty()
    .withMessage('Visibility is required')
    .isBoolean()
    .withMessage('Visibility must be a boolean (true or false)')
    .custom((value) => {
      if (typeof value === 'string' && (value === 'true' || value === 'false')) {
        return true;
      }
      if (typeof value === 'boolean') {
        return true;
      }
      throw new Error('Visibility must be a boolean or string "true"/"false"');
    })
];

// Find similar medicines validation
exports.findSimilarMedicinesValidation = [
  // This validation is for query parameters, handled by route
];

