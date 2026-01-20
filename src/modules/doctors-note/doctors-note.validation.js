const { body, query } = require('express-validator');

// Create doctor's note validation
exports.createDoctorsNoteValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['illness', 'injury'])
    .withMessage('Type must be illness or injury'),
  
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(['work', 'school'])
    .withMessage('Purpose must be work or school'),
  
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('patientName')
    .notEmpty()
    .withMessage('Patient name is required')
    .isString()
    .withMessage('Patient name must be a string'),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0')
];

// Create template validation (Admin)
exports.createTemplateValidation = [
  body('productName')
    .notEmpty()
    .withMessage('Product name is required')
    .isString()
    .withMessage('Product name must be a string')
    .trim(),
  
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim(),
  
  body('shortDescription')
    .optional()
    .isString()
    .withMessage('Short description must be a string')
    .trim(),
  
  body('coverageDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Coverage days must be between 1 and 30'),
  
  body('image.url')
    .optional()
    .isString()
    .withMessage('Image URL must be a string')
    .trim(),
  
  body('image.alt')
    .optional()
    .isString()
    .withMessage('Image alt text must be a string')
    .trim(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('visibility')
    .optional()
    .isBoolean()
    .withMessage('visibility must be a boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

// Get all templates query validation (optional)
exports.getAllTemplatesQueryValidation = [
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
    .withMessage('Search must be a string')
    .trim(),
  
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),
  
  query('visibility')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('visibility must be true or false'),
  
  query('sortBy')
    .optional()
    .isIn(['order', 'price', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: order, price, createdAt, updatedAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc'),
  
  query('includeDeleted')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeDeleted must be true or false')
];

// Update template validation (Admin)
exports.updateTemplateValidation = [
  body('productName')
    .optional()
    .isString()
    .withMessage('Product name must be a string')
    .trim(),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim(),
  
  body('shortDescription')
    .optional()
    .isString()
    .withMessage('Short description must be a string')
    .trim(),
  
  body('coverageDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Coverage days must be between 1 and 30'),
  
  body('image.url')
    .optional()
    .isString()
    .withMessage('Image URL must be a string')
    .trim(),
  
  body('image.alt')
    .optional()
    .isString()
    .withMessage('Image alt text must be a string')
    .trim(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  body('visibility')
    .optional()
    .isBoolean()
    .withMessage('visibility must be a boolean'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

