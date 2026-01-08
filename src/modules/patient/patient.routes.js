const router = require('express').Router();
const controller = require('./patient.controller');
const savedMedicineController = require('./saved-medicine.controller');
const savedMedicineValidation = require('./saved-medicine.validation');
const validate = require('../../middlewares/validate.middleware');
const auth = require('../../middlewares/auth.middleware');
const { updateProfileValidation } = require('./patient.validation');

// Profile routes
router.get('/profile', auth, controller.getProfile);
router.put('/profile', auth, updateProfileValidation, validate, controller.updateProfile);

// ==================== SAVED MEDICINES ROUTES ====================

// Get all saved medicines
router.get(
  '/saved-medicines',
  auth,
  savedMedicineValidation.getSavedMedicinesValidation,
  validate,
  savedMedicineController.getSavedMedicines
);

// Check if medicine is saved
router.get(
  '/saved-medicines/:medicineId/check',
  auth,
  savedMedicineValidation.medicineIdValidation,
  validate,
  savedMedicineController.isMedicineSaved
);

// Save medicine
router.post(
  '/saved-medicines/:medicineId',
  auth,
  savedMedicineValidation.medicineIdValidation,
  validate,
  savedMedicineController.saveMedicine
);

// Unsave medicine
router.delete(
  '/saved-medicines/:medicineId',
  auth,
  savedMedicineValidation.medicineIdValidation,
  validate,
  savedMedicineController.unsaveMedicine
);

module.exports = router;

