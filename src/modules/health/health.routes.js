const express = require('express');
const router = express.Router();
const healthController = require('./health.controller');
const healthValidation = require('./health.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');
const { verifyAccessToken } = require('../../utils/jwt');
const User = require('../../models/User.model');

// Optional auth middleware - sets req.user if token is valid, but doesn't fail if no token
const optionalAuthMiddleware = async (req, res, next) => {
  const logger = require('../../utils/logger');
  const authHeader = req.headers.authorization;

  logger.info('Optional auth middleware called', {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!authHeader
  });

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - continue without authentication
    logger.info('No auth header, continuing without authentication');
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    logger.info('Token decoded successfully', { userId: decoded.id });
    
    // Load user data if token is valid
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = {
        id: user._id,
        role: user.role,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified
      };
      logger.info('User found and set in req.user', { userId: user._id, role: user.role });
    } else {
      logger.warn('User not found in database but token is valid', { userId: decoded.id });
    }
    // If user not found, continue without req.user (don't fail)
    next();
  } catch (err) {
    // If token is invalid, continue without authentication (don't fail)
    logger.warn('Token verification failed, continuing without authentication', {
      error: err.message,
      errorName: err.name
    });
    next();
  }
};

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

// ==================== MEDICINE MARKING ROUTES (Public - Optional Auth) ====================
// Mark medicine as trendy (Optional auth - works with or without token)
router.put(
  '/medications/:id/mark-trendy',
  optionalAuthMiddleware,
  healthValidation.medicineIdValidation,
  validate,
  healthController.markMedicineAsTrendy
);

// Unmark medicine as trendy (Optional auth - works with or without token)
router.put(
  '/medications/:id/unmark-trendy',
  optionalAuthMiddleware,
  healthValidation.medicineIdValidation,
  validate,
  healthController.unmarkMedicineAsTrendy
);

// Mark medicine as best offer (Optional auth - works with or without token)
router.put(
  '/medications/:id/mark-best-offer',
  optionalAuthMiddleware,
  healthValidation.medicineIdValidation,
  healthValidation.markBestOfferValidation,
  validate,
  healthController.markMedicineAsBestOffer
);

// Unmark medicine as best offer (Optional auth - works with or without token)
router.put(
  '/medications/:id/unmark-best-offer',
  optionalAuthMiddleware,
  healthValidation.medicineIdValidation,
  validate,
  healthController.unmarkMedicineAsBestOffer
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

// Bulk create health categories
router.post(
  '/categories/bulk',
  healthValidation.bulkCreateHealthCategoriesValidation,
  validate,
  healthController.bulkCreateHealthCategories
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
// Note: Mark/Unmark trendy and best offer routes are defined in PUBLIC section above

// Update medicine health category and type relation
router.put(
  '/medications/:id/health-relation',
  healthValidation.medicineIdValidation,
  healthValidation.updateMedicineHealthRelationValidation,
  validate,
  healthController.updateMedicineHealthRelation
);

module.exports = router;

