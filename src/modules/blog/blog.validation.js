const { body, query, param } = require('express-validator');

// Validation for creating blog
exports.createBlogValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty'),
  
  body('excerpt')
    .optional()
    .isString()
    .withMessage('Excerpt must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters'),
  
  body('featuredImage')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object';
        } catch (e) {
          return false;
        }
      }
      return typeof value === 'object' || value === undefined;
    })
    .withMessage('Featured image must be a valid JSON object'),
  
  body('media')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch (e) {
          return false;
        }
      }
      return Array.isArray(value) || value === undefined;
    })
    .withMessage('Media must be a valid array'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) || typeof parsed === 'string';
        } catch (e) {
          return typeof value === 'string';
        }
      }
      return Array.isArray(value) || value === undefined;
    })
    .withMessage('Tags must be an array or comma-separated string'),
  
  body('metaTitle')
    .optional()
    .isString()
    .withMessage('Meta title must be a string')
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title must not exceed 60 characters'),
  
  body('metaDescription')
    .optional()
    .isString()
    .withMessage('Meta description must be a string')
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description must not exceed 160 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('isFeatured')
    .optional()
    .custom((value) => {
      if (value === 'true' || value === 'false' || value === true || value === false) {
        return true;
      }
      return false;
    })
    .withMessage('isFeatured must be a boolean'),
  
  body('seoKeywords')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) || typeof parsed === 'string';
        } catch (e) {
          return typeof value === 'string';
        }
      }
      return Array.isArray(value) || value === undefined;
    })
    .withMessage('SEO keywords must be an array or comma-separated string')
];

// Validation for updating blog
exports.updateBlogValidation = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('excerpt')
    .optional()
    .isString()
    .withMessage('Excerpt must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters'),
  
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty'),
  
  body('featuredImage')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object';
        } catch (e) {
          return false;
        }
      }
      return typeof value === 'object' || value === undefined;
    })
    .withMessage('Featured image must be a valid JSON object'),
  
  body('media')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch (e) {
          return false;
        }
      }
      return Array.isArray(value) || value === undefined;
    })
    .withMessage('Media must be a valid array'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) || typeof parsed === 'string';
        } catch (e) {
          return typeof value === 'string';
        }
      }
      return Array.isArray(value) || value === undefined;
    })
    .withMessage('Tags must be an array or comma-separated string'),
  
  body('metaTitle')
    .optional()
    .isString()
    .withMessage('Meta title must be a string')
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta title must not exceed 60 characters'),
  
  body('metaDescription')
    .optional()
    .isString()
    .withMessage('Meta description must be a string')
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description must not exceed 160 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  body('isFeatured')
    .optional()
    .custom((value) => {
      if (value === 'true' || value === 'false' || value === true || value === false) {
        return true;
      }
      return false;
    })
    .withMessage('isFeatured must be a boolean'),
  
  body('seoKeywords')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) || typeof parsed === 'string';
        } catch (e) {
          return typeof value === 'string';
        }
      }
      return Array.isArray(value) || value === undefined;
    })
    .withMessage('SEO keywords must be an array or comma-separated string')
];

// Validation for getting blogs
exports.getAllBlogsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  query('categorySlug')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category slug must not be empty'),
  
  query('authorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  
  query('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'publishedAt', 'title', 'views'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Validation for blog ID
exports.blogIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid blog ID')
];

// Validation for blog slug
exports.blogSlugValidation = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Slug must be between 1 and 200 characters')
];

// Validation for related blogs
exports.getRelatedBlogsValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid blog ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
];

