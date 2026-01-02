const express = require('express');
const router = express.Router();
const doctorController = require('./doctor.controller');
const doctorValidation = require('./doctor.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/admin.middleware');

// All routes require admin authentication
router.use(authMiddleware);
router.use(isAdmin);

// Get statistics
router.get('/statistics', doctorController.getStatistics);

// Get available specialties
router.get('/specialties', doctorController.getAvailableSpecialties);

// Doctor CRUD routes
router.post(
  '/',
  doctorValidation.createDoctorValidation,
  doctorController.createDoctor
);

router.get('/', doctorController.getAllDoctors);

router.get('/:id', doctorController.getDoctorById);

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

