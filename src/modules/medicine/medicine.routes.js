const express = require('express');
const router = express.Router();
const medicineController = require('./medicine.controller');
const medicineValidation = require('./medicine.validation');
const { uploadMultipleImages } = require('../../middlewares/upload.middleware');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC ROUTES (No Authentication Required) ====================

// Bulk add medicines from JSON payload (no file uploads)
router.post(
  '/medicines/json-upload',
  medicineValidation.bulkJsonUploadValidation,
  validate,
  medicineController.bulkUploadMedicinesFromJson
);

// Get all medicines
router.get(
  '/medicines',
  medicineValidation.getAllMedicinesValidation,
  validate,
  medicineController.getAllMedicines
);

// Find similar medicines (Public) - MUST come before /medicines/:id to avoid route conflicts
router.get('/medicines/:id/similar', medicineController.findSimilarMedicines);

// Get medicine by ID
router.get('/medicines/:id', medicineController.getMedicineById);

// Add new medicine (with multiple image uploads) - PUBLIC
router.post(
  '/medicines',
  uploadMultipleImages,
  medicineValidation.addMedicineValidation,
  validate,
  medicineController.addMedicine
);

// Add new medicine and mark as best offer (with multiple image uploads) - PUBLIC
router.post(
  '/medicines/best',
  uploadMultipleImages,
  medicineValidation.addMedicineValidation,
  validate,
  medicineController.addBestMedicine
);

// Update medicine stock and status (dedicated endpoint) - MUST come before /medicines/:id - PUBLIC
router.put(
  '/medicines/:id/stock-status',
  medicineValidation.updateStockStatusValidation,
  validate,
  medicineController.updateMedicineStockStatus
);

// Update medicine visibility (dedicated endpoint) - MUST come before /medicines/:id - PUBLIC
router.put(
  '/medicines/:id/visibility',
  medicineValidation.updateVisibilityValidation,
  validate,
  medicineController.updateMedicineVisibility
);

// Update medicine (with optional image uploads) - PUBLIC
router.put(
  '/medicines/:id',
  uploadMultipleImages,
  medicineValidation.addMedicineValidation,
  validate,
  medicineController.updateMedicine
);

// Delete medicine - PUBLIC
router.delete('/medicines/:id', medicineController.deleteMedicine);

module.exports = router;

