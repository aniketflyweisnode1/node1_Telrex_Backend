const express = require('express');
const router = express.Router();
const blogController = require('./blog.controller');
const blogValidation = require('./blog.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const { uploadMultipleImages } = require('../../middlewares/upload.middleware');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC GET ROUTES (No Authentication Required) ====================
// These routes are accessible without token and only return published blogs

// Get all blogs (public - only published)
router.get(
  '/',
  blogValidation.getAllBlogsValidation,
  validate,
  blogController.getAllBlogs
);

// Get blog by slug (public - only published)
router.get(
  '/slug/:slug',
  blogValidation.blogSlugValidation,
  validate,
  blogController.getBlogBySlug
);

// Related blogs route must come before /:id route to avoid route conflict (public - only published)
router.get(
  '/:id/related',
  blogValidation.getRelatedBlogsValidation,
  validate,
  blogController.getRelatedBlogs
);

// Get blog by ID (public - only published)
router.get(
  '/:id',
  blogValidation.blogIdValidation,
  validate,
  blogController.getBlogById
);

// ==================== PROTECTED ROUTES (Admin/Sub-Admin Only) ====================
// All POST, PUT, DELETE routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Create blog
router.post(
  '/',
  uploadMultipleImages,
  blogValidation.createBlogValidation,
  validate,
  blogController.createBlog
);

// Update blog
router.put(
  '/:id',
  uploadMultipleImages,
  blogValidation.updateBlogValidation,
  validate,
  blogController.updateBlog
);

// Publish blog
router.put(
  '/:id/publish',
  blogValidation.blogIdValidation,
  validate,
  blogController.publishBlog
);

// Unpublish blog
router.put(
  '/:id/unpublish',
  blogValidation.blogIdValidation,
  validate,
  blogController.unpublishBlog
);

// Save blog as draft
router.put(
  '/:id/draft',
  blogValidation.blogIdValidation,
  validate,
  blogController.saveAsDraft
);

// Permanently delete blog (hard delete) - must come before /:id route
router.delete(
  '/:id/permanent',
  blogValidation.blogIdValidation,
  validate,
  blogController.permanentlyDeleteBlog
);

// Delete blog (soft delete - archive)
router.delete(
  '/:id',
  blogValidation.blogIdValidation,
  validate,
  blogController.deleteBlog
);

module.exports = router;

