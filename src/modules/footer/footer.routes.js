const express = require('express');
const router = express.Router();
const footerController = require('./footer.controller');
const footerValidation = require('./footer.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get all footer sections
router.get(
  '/',
  footerValidation.getAllFooterSectionsValidation,
  validate,
  footerController.getAllFooterSections
);

// Get footer section by section name
router.get(
  '/section/:section',
  footerValidation.sectionNameValidation,
  validate,
  footerController.getFooterSectionBySection
);

// Get footer section by ID
router.get('/:id', footerController.getFooterSectionById);

// Create footer section
router.post(
  '/',
  footerValidation.createFooterSectionValidation,
  validate,
  footerController.createFooterSection
);

// Update footer section by ID
router.put(
  '/:id',
  footerValidation.updateFooterSectionValidation,
  validate,
  footerController.updateFooterSection
);

// Update footer section by section name
router.put(
  '/section/:section',
  footerValidation.sectionNameValidation,
  footerValidation.updateFooterSectionValidation,
  validate,
  footerController.updateFooterSectionBySection
);

// Publish footer section
router.put(
  '/:id/publish',
  footerController.publishFooterSection
);

// Save as draft
router.put(
  '/:id/draft',
  footerController.saveAsDraft
);

// Delete footer section
router.delete('/:id', footerController.deleteFooterSection);

module.exports = router;

