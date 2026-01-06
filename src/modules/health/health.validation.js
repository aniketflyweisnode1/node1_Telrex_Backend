const { body, query, param } = require('express-validator');

// Get all health categories validation
exports.getAllHealthCategoriesValidation = [
  query('search')
    .optional()
    .isString()
    .trim(),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('sortBy')
    .optional()
    .isIn(['name', 'order', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: name, order, createdAt, updatedAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

// Get health category by ID validation
exports.categoryIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid health category ID')
];

// Get health category by slug validation
exports.categorySlugValidation = [
  param('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .isString()
    .trim()
];

// Get category types validation
exports.getCategoryTypesValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Invalid health category ID')
];

// Get medications by category ID validation
exports.getMedicationsByCategoryIdValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Invalid health category ID'),
  query('search')
    .optional()
    .isString()
    .trim(),
  query('healthTypeSlug')
    .optional()
    .isString()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Health type slug must be lowercase alphanumeric with hyphens'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('status')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock', 'discontinued'])
    .withMessage('Status must be one of: in_stock, low_stock, out_of_stock, discontinued'),
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'productName', 'salePrice', 'views'])
    .withMessage('sortBy must be one of: createdAt, productName, salePrice, views'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

// Get medications validation
exports.getMedicationsValidation = [
  query('search')
    .optional()
    .isString()
    .trim(),
  query('category')
    .optional()
    .isString()
    .trim(),
  query('healthCategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid health category ID'),
  query('healthTypeSlug')
    .optional()
    .isString()
    .trim(),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be a positive number'),
  query('status')
    .optional()
    .isIn(['in_stock', 'low_stock', 'out_of_stock'])
    .withMessage('status must be one of: in_stock, low_stock, out_of_stock'),
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean'),
  query('sortBy')
    .optional()
    .isIn(['productName', 'brand', 'salePrice', 'originalPrice', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: productName, brand, salePrice, originalPrice, createdAt, updatedAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

// Get trendy medications validation
exports.getTrendyMedicationsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50'),
  query('category')
    .optional()
    .isString()
    .trim()
];

// Get best offers validation
exports.getBestOffersValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50'),
  query('category')
    .optional()
    .isString()
    .trim()
];

// Create health category validation
exports.createHealthCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('icon')
    .optional()
    .trim()
    .isString()
    .withMessage('Icon must be a string'),
  body('types')
    .optional()
    .isArray()
    .withMessage('Types must be an array'),
  body('types.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Type name must be between 2 and 100 characters'),
  body('types.*.slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Type slug must be lowercase alphanumeric with hyphens'),
  body('types.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Type description must not exceed 500 characters'),
  body('types.*.icon')
    .optional()
    .trim()
    .isString()
    .withMessage('Type icon must be a string'),
  body('types.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Type order must be a non-negative integer'),
  body('types.*.isActive')
    .optional()
    .isBoolean()
    .withMessage('Type isActive must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Update health category validation
exports.updateHealthCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('icon')
    .optional()
    .trim()
    .isString()
    .withMessage('Icon must be a string'),
  body('types')
    .optional()
    .isArray()
    .withMessage('Types must be an array'),
  body('types.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Type name must be between 2 and 100 characters'),
  body('types.*.slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Type slug must be lowercase alphanumeric with hyphens'),
  body('types.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Type description must not exceed 500 characters'),
  body('types.*.icon')
    .optional()
    .trim()
    .isString()
    .withMessage('Type icon must be a string'),
  body('types.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Type order must be a non-negative integer'),
  body('types.*.isActive')
    .optional()
    .isBoolean()
    .withMessage('Type isActive must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Medicine ID validation
exports.medicineIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Medicine ID must be a valid MongoDB ID')
];

// Update medicine health relation validation
exports.updateMedicineHealthRelationValidation = [
  body('healthCategory')
    .optional()
    .isMongoId()
    .withMessage('Health category ID must be a valid MongoDB ID'),
  body('healthTypeSlug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Health type slug must be lowercase alphanumeric with hyphens')
];

// Mark medicine as best offer validation (with discount percentage)
exports.markBestOfferValidation = [
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100')
];
