const express = require('express');
const router = express.Router();
const doctorController = require('./doctor.controller');
const doctorValidation = require('./doctor.validation');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC ROUTES (No Authentication Required) ====================
// Get all doctors
router.get('/', doctorController.getAllDoctors);

// Get statistics - PUBLIC
router.get('/statistics', doctorController.getStatistics);

// Get specialties - PUBLIC
router.get('/specialties', doctorController.getAvailableSpecialties);

// Get doctor by ID - PUBLIC
router.get('/:id', doctorController.getDoctorById);

// Doctor CRUD routes
router.post(
  '/',
  doctorValidation.createDoctorValidation,
  doctorController.createDoctor
);

router.put(
  '/:id/reset-password',
  doctorValidation.resetPasswordValidation,
  doctorController.resetPassword
);

router.put(
  '/:id',
  doctorValidation.updateDoctorValidation,
  doctorController.updateDoctor
);

router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;

