const express = require('express');
const router = express.Router();
const specializationController = require('./specialization.controller');
const specializationValidation = require('./specialization.validation');
const validate = require('../../middlewares/validate.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');

// ==================== PUBLIC ROUTES (No Authentication Required) ====================
// Get all specializations (public)
router.get(
  '/',
  specializationValidation.getSpecializationsValidation,
  validate,
  specializationController.getSpecializations
);

// Get specialization by ID (public)
router.get(
  '/:id',
  specializationValidation.getSpecializationByIdValidation,
  validate,
  specializationController.getSpecializationById
);

// ==================== ADMIN/SUB-ADMIN ROUTES (Authentication Required) ====================
// All routes below require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Create specialization
router.post(
  '/',
  specializationValidation.createSpecializationValidation,
  validate,
  specializationController.createSpecialization
);

// Change specialization status (active/inactive) - MUST come before /:id route
// Supports both PUT and PATCH methods
router.put(
  '/:id/status',
  specializationValidation.changeSpecializationStatusValidation,
  validate,
  specializationController.changeSpecializationStatus
);

router.patch(
  '/:id/status',
  specializationValidation.changeSpecializationStatusValidation,
  validate,
  specializationController.changeSpecializationStatus
);

// Update specialization
router.put(
  '/:id',
  specializationValidation.updateSpecializationValidation,
  validate,
  specializationController.updateSpecialization
);

// Delete specialization
router.delete(
  '/:id',
  specializationValidation.deleteSpecializationValidation,
  validate,
  specializationController.deleteSpecialization
);

module.exports = router;

