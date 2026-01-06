const { body, query, param } = require('express-validator');

// Get all blog categories validation
exports.getAllBlogCategoriesValidation = [
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be true or false'),
  query('sortBy')
    .optional()
    .isIn(['name', 'slug', 'order', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: name, slug, order, createdAt, updatedAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Create blog category validation
exports.createBlogCategoryValidation = [
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
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Update blog category validation
exports.updateBlogCategoryValidation = [
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
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Category ID validation
exports.categoryIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ID')
];

// Category slug validation
exports.categorySlugValidation = [
  param('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens')
];

