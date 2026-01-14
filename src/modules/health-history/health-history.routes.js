const express = require('express');
const router = express.Router({ mergeParams: true });
const healthHistoryController = require('./health-history.controller');
const healthHistoryValidation = require('./health-history.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get all health histories for a patient
router.get(
  '/',
  healthHistoryValidation.getHealthHistoriesValidation,
  validate,
  healthHistoryController.getHealthHistories
);

// Get health history by ID
router.get(
  '/:healthHistoryId',
  healthHistoryValidation.getHealthHistoryByIdValidation,
  validate,
  healthHistoryController.getHealthHistoryById
);

// Create health history
router.post(
  '/',
  healthHistoryValidation.createHealthHistoryValidation,
  validate,
  healthHistoryController.createHealthHistory
);

// Update health history
router.put(
  '/:healthHistoryId',
  healthHistoryValidation.updateHealthHistoryValidation,
  validate,
  healthHistoryController.updateHealthHistory
);

// Delete health history
router.delete(
  '/:healthHistoryId',
  healthHistoryValidation.deleteHealthHistoryValidation,
  validate,
  healthHistoryController.deleteHealthHistory
);

module.exports = router;

