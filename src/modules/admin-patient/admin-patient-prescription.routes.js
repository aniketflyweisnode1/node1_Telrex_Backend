const express = require('express');
const router = express.Router({ mergeParams: true });
const prescriptionController = require('./admin-patient-prescription.controller');
const prescriptionValidation = require('./admin-patient-prescription.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get all prescriptions for a patient
router.get(
  '/',
  prescriptionValidation.getPrescriptionsValidation,
  validate,
  prescriptionController.getPrescriptions
);

// Get prescription by ID
router.get(
  '/:prescriptionId',
  prescriptionValidation.getPrescriptionByIdValidation,
  validate,
  prescriptionController.getPrescriptionById
);

// Create prescription
router.post(
  '/',
  prescriptionValidation.createPrescriptionValidation,
  validate,
  prescriptionController.createPrescription
);

// Update prescription
router.put(
  '/:prescriptionId',
  prescriptionValidation.updatePrescriptionValidation,
  validate,
  prescriptionController.updatePrescription
);

// Delete prescription
router.delete(
  '/:prescriptionId',
  prescriptionValidation.deletePrescriptionValidation,
  validate,
  prescriptionController.deletePrescription
);

module.exports = router;

