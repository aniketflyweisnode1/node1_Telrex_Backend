const express = require('express');
const router = express.Router();
const healthController = require('./health.controller');
const healthValidation = require('./health.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC GET ROUTES (No Authentication Required - No Token Needed) ====================
// All GET routes below are PUBLIC and do NOT require any authentication token
// These routes can be accessed without Authorization header

// Get all health categories
router.get(
  '/categories',
  healthValidation.getAllHealthCategoriesValidation,
  validate,
  healthController.getAllHealthCategories
);

// Get health category by slug (must come before /categories/:id to avoid conflicts)
router.get(
  '/categories/slug/:slug',
  healthValidation.categorySlugValidation,
  validate,
  healthController.getHealthCategoryBySlug
);

// Get types (chronic conditions) for a category (must come before /categories/:id)
router.get(
  '/categories/:categoryId/types',
  healthValidation.getCategoryTypesValidation,
  validate,
  healthController.getCategoryTypes
);

// Get medications by health category ID (must come before /categories/:id)
router.get(
  '/categories/:categoryId/medications',
  healthValidation.getMedicationsByCategoryIdValidation,
  validate,
  healthController.getMedicationsByCategoryId
);

// Get health category by ID (must come last to avoid conflicts with more specific routes)
router.get(
  '/categories/:id',
  healthValidation.categoryIdValidation,
  validate,
  healthController.getHealthCategoryById
);

// Get medications by health category ID (alternative path: /medicines/:categoryId)
router.get(
  '/medicines/:categoryId',
  healthValidation.getMedicationsByCategoryIdValidation,
  validate,
  healthController.getMedicationsByCategoryId
);

// Get medications with filters
router.get(
  '/medications',
  healthValidation.getMedicationsValidation,
  validate,
  healthController.getMedications
);

// Get trendy medications
router.get(
  '/medications/trendy',
  healthValidation.getTrendyMedicationsValidation,
  validate,
  healthController.getTrendyMedications
);

// Get best offers
router.get(
  '/medications/best-offers',
  healthValidation.getBestOffersValidation,
  validate,
  healthController.getBestOffers
);

// ==================== PROTECTED ROUTES (Admin/Sub-Admin Only) ====================
// All POST, PUT, DELETE routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Create health category
router.post(
  '/categories',
  healthValidation.createHealthCategoryValidation,
  validate,
  healthController.createHealthCategory
);

// Update health category
router.put(
  '/categories/:id',
  healthValidation.categoryIdValidation,
  healthValidation.updateHealthCategoryValidation,
  validate,
  healthController.updateHealthCategory
);

// Activate health category
router.put(
  '/categories/:id/activate',
  healthValidation.categoryIdValidation,
  validate,
  healthController.activateHealthCategory
);

// Deactivate health category
router.put(
  '/categories/:id/deactivate',
  healthValidation.categoryIdValidation,
  validate,
  healthController.deactivateHealthCategory
);

// Delete health category (soft delete)
router.delete(
  '/categories/:id',
  healthValidation.categoryIdValidation,
  validate,
  healthController.deleteHealthCategory
);

// ==================== MEDICINE MANAGEMENT ROUTES (Admin/Sub-Admin Only) ====================

// Mark medicine as trendy
router.put(
  '/medications/:id/mark-trendy',
  healthValidation.medicineIdValidation,
  validate,
  healthController.markMedicineAsTrendy
);

// Unmark medicine as trendy
router.put(
  '/medications/:id/unmark-trendy',
  healthValidation.medicineIdValidation,
  validate,
  healthController.unmarkMedicineAsTrendy
);

// Mark medicine as best offer
router.put(
  '/medications/:id/mark-best-offer',
  healthValidation.medicineIdValidation,
  healthValidation.markBestOfferValidation,
  validate,
  healthController.markMedicineAsBestOffer
);

// Unmark medicine as best offer
router.put(
  '/medications/:id/unmark-best-offer',
  healthValidation.medicineIdValidation,
  validate,
  healthController.unmarkMedicineAsBestOffer
);

// Update medicine health category and type relation
router.put(
  '/medications/:id/health-relation',
  healthValidation.medicineIdValidation,
  healthValidation.updateMedicineHealthRelationValidation,
  validate,
  healthController.updateMedicineHealthRelation
);

module.exports = router;

