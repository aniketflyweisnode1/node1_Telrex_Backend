const { body, query } = require('express-validator');

// Bulk JSON upload validation
exports.bulkJsonUploadValidation = [
  body('medicines')
    .if(body('data').not().exists())
    .if(body('items').not().exists())
    .exists()
    .withMessage('medicines field is required')
    .bail()
    .isArray({ min: 1 })
    .withMessage('medicines must be a non-empty array')
];

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
  
  // Category and SubCategory (Preferred field names)
  // category = Health Category ID (MongoDB ObjectId)
  // subCategory = Health Type Slug (from category's types array)
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ObjectId'),
  
  body('subCategory')
    .optional()
    .custom((value, { req }) => {
      // If subCategory is provided, category must also be provided
      if (value && !req.body.category && !req.body.healthCategory) {
        throw new Error('Category is required when subCategory is provided');
      }
      // subCategory can be either a slug (string) or type ID (MongoDB ObjectId)
      if (value) {
        const mongoose = require('mongoose');
        const isObjectId = mongoose.Types.ObjectId.isValid(value);
        const isSlug = typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim());
        if (!isObjectId && !isSlug) {
          throw new Error('SubCategory must be either a valid MongoDB ObjectId or a lowercase alphanumeric slug with hyphens');
        }
      }
      return true;
    })
    .withMessage('SubCategory must be either a type ID (MongoDB ObjectId) or a slug (lowercase alphanumeric with hyphens)'),

  // Health Category and Type relationships (Legacy/Alternative field names for backward compatibility)
  // Note: If healthTypeSlug/subCategory is provided, healthCategory/category MUST be provided
  // healthTypeSlug/subCategory must be one of the types within the selected healthCategory/category
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
      // If healthTypeSlug is provided, healthCategory or category must also be provided
      if (value && !req.body.healthCategory && !req.body.category) {
        throw new Error('Category (or healthCategory) is required when healthTypeSlug is provided');
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

// Get all medicines validation (query parameters)
exports.getAllMedicinesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('visibility')
    .optional()
    .custom((value) => {
      const validValues = ['true', 'false', 'all', true, false];
      if (validValues.includes(value)) {
        return true;
      }
      throw new Error('Visibility must be true, false, or all');
    }),
  query('includeHidden')
    .optional()
    .isIn(['true', 'false', true, false])
    .withMessage('includeHidden must be true or false'),
  query('all')
    .optional()
    .isIn(['true', 'false', true, false])
    .withMessage('all must be true or false'),
  query('status')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock'])
    .withMessage('Status must be in_stock, low_stock, or out_of_stock'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string'),
  query('availability')
    .optional()
    .isIn(['in_stock', 'out_of_stock', 'low_stock', 'available', 'all'])
    .withMessage('Availability must be in_stock, out_of_stock, low_stock, available, or all'),
  query('inStock')
    .optional()
    .isIn(['true', 'false', true, false])
    .withMessage('inStock must be true or false'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('sortBy must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc')
];

// Find similar medicines validation
exports.findSimilarMedicinesValidation = [
  // This validation is for query parameters, handled by route
];

