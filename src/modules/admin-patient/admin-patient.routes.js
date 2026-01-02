const express = require('express');
const router = express.Router();
const adminPatientController = require('./admin-patient.controller');
const adminPatientValidation = require('./admin-patient.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get patient statistics
router.get('/patients/statistics', adminPatientController.getPatientStatistics);

// Get all patients
router.get(
  '/patients',
  adminPatientValidation.getAllPatientsValidation,
  validate,
  adminPatientController.getAllPatients
);

// Get patient by ID
router.get('/patients/:id', adminPatientController.getPatientById);

// Update patient status (activate/deactivate)
router.put(
  '/patients/:id/status',
  adminPatientValidation.updatePatientStatusValidation,
  validate,
  adminPatientController.updatePatientStatus
);

module.exports = router;

