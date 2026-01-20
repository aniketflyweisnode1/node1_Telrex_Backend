const express = require('express');
const router = express.Router();
const doctorController = require('./doctor.controller');
const doctorValidation = require('./doctor.validation');
const validate = require('../../middlewares/validate.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/admin.middleware');

// ==================== PUBLIC ROUTES (No Authentication Required) ====================
// Get all doctors
router.get(
  '/',
  doctorValidation.getAllDoctorsValidation,
  validate,
  doctorController.getAllDoctors
);

// Get statistics - PUBLIC
router.get('/statistics', doctorController.getStatistics);

// Get specialties - PUBLIC
router.get('/specialties', doctorController.getAvailableSpecialties);

// Get doctors by specialization - PUBLIC (must come before /:id to avoid route conflicts)
router.get(
  '/specialization/:specializationIdOrName',
  doctorValidation.getDoctorsBySpecializationValidation,
  validate,
  doctorController.getDoctorsBySpecialization
);

// Get filter options - PUBLIC (must come before /:id to avoid route conflicts)
router.get('/filter-options', doctorController.getFilterOptions);

// Get doctor by ID - PUBLIC (with validation) - Must be last to avoid catching other routes
// Note: /admin/doctors/earnings is handled by doctor-earnings module which is mounted before this
router.get(
  '/:id',
  doctorValidation.getDoctorByIdValidation,
  validate,
  doctorController.getDoctorById
);

// Doctor CRUD routes (Admin only)
router.post(
  '/',
  authMiddleware,
  isAdmin,
  doctorValidation.createDoctorValidation,
  validate,
  doctorController.createDoctor
);

router.put(
  '/:id/reset-password',
  doctorValidation.resetPasswordValidation,
  doctorController.resetPassword
);

// Approve doctor (Admin only - MUST come before /:id to avoid route conflicts)
router.put(
  '/:id/approve',
  authMiddleware,
  isAdmin,
  doctorController.approveDoctor
);

// Update doctor (Public - no authentication required)
router.put(
  '/:id',
  doctorValidation.updateDoctorValidation,
  validate,
  doctorController.updateDoctor
);

router.delete(
  '/:id',
  authMiddleware,
  isAdmin,
  doctorController.deleteDoctor
);

module.exports = router;

