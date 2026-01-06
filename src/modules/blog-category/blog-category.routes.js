const express = require('express');
const router = express.Router();
const blogCategoryController = require('./blog-category.controller');
const blogCategoryValidation = require('./blog-category.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC GET ROUTES (No Authentication Required) ====================
// These routes are accessible without token and only return active categories

// Get all blog categories (public - only active)
router.get(
  '/',
  blogCategoryValidation.getAllBlogCategoriesValidation,
  validate,
  blogCategoryController.getAllBlogCategories
);

// Get blog category by slug (public - only active)
router.get(
  '/slug/:slug',
  blogCategoryValidation.categorySlugValidation,
  validate,
  blogCategoryController.getBlogCategoryBySlug
);

// Get blog category by ID (public - only active)
router.get(
  '/:id',
  blogCategoryValidation.categoryIdValidation,
  validate,
  blogCategoryController.getBlogCategoryById
);

// ==================== PROTECTED ROUTES (Admin/Sub-Admin Only) ====================
// All POST, PUT, DELETE routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Create blog category
router.post(
  '/',
  blogCategoryValidation.createBlogCategoryValidation,
  validate,
  blogCategoryController.createBlogCategory
);

// Update blog category
router.put(
  '/:id',
  blogCategoryValidation.categoryIdValidation,
  blogCategoryValidation.updateBlogCategoryValidation,
  validate,
  blogCategoryController.updateBlogCategory
);

// Activate blog category
router.put(
  '/:id/activate',
  blogCategoryValidation.categoryIdValidation,
  validate,
  blogCategoryController.activateBlogCategory
);

// Deactivate blog category
router.put(
  '/:id/deactivate',
  blogCategoryValidation.categoryIdValidation,
  validate,
  blogCategoryController.deactivateBlogCategory
);

// Delete blog category (soft delete)
router.delete(
  '/:id',
  blogCategoryValidation.categoryIdValidation,
  validate,
  blogCategoryController.deleteBlogCategory
);

module.exports = router;

