const { body, param, query } = require('express-validator');

/**
 * Validation for getting all specializations
 */
exports.getSpecializationsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .trim()
    .withMessage('Search must be a string'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean()
];

/**
 * Validation for getting specialization by ID
 */
exports.getSpecializationByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Specialization ID must be a valid MongoDB ID')
];

/**
 * Validation for creating specialization
 */
exports.createSpecializationValidation = [
  body('name')
    .notEmpty()
    .withMessage('Specialization name is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean()
];

/**
 * Validation for updating specialization
 */
exports.updateSpecializationValidation = [
  param('id')
    .isMongoId()
    .withMessage('Specialization ID must be a valid MongoDB ID'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean()
];

/**
 * Validation for changing specialization status
 */
exports.changeSpecializationStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Specialization ID must be a valid MongoDB ID'),
  body('isActive')
    .notEmpty()
    .withMessage('isActive status is required')
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean()
];

/**
 * Validation for deleting specialization
 */
exports.deleteSpecializationValidation = [
  param('id')
    .isMongoId()
    .withMessage('Specialization ID must be a valid MongoDB ID')
];

