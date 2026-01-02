const express = require('express');
const router = express.Router();
const medicineController = require('./medicine.controller');
const medicineValidation = require('./medicine.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const { uploadMultipleImages } = require('../../middlewares/upload.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Add new medicine (with multiple image uploads)
router.post(
  '/medicines',
  uploadMultipleImages,
  medicineValidation.addMedicineValidation,
  validate,
  medicineController.addMedicine
);

// Get all medicines
router.get('/medicines', medicineController.getAllMedicines);

// Get medicine by ID
router.get('/medicines/:id', medicineController.getMedicineById);

// Update medicine (with optional image uploads)
router.put(
  '/medicines/:id',
  uploadMultipleImages,
  medicineValidation.addMedicineValidation,
  validate,
  medicineController.updateMedicine
);

// Delete medicine
router.delete('/medicines/:id', medicineController.deleteMedicine);

module.exports = router;

