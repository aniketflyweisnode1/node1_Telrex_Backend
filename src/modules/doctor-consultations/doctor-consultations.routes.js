const express = require('express');
const router = express.Router();
const doctorConsultationsController = require('./doctor-consultations.controller');
const doctorConsultationsValidation = require('./doctor-consultations.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isDoctor } = require('../../middlewares/doctor.middleware');
const validate = require('../../middlewares/validate.middleware');

// GET routes are public (no authentication required)
// Get all consultations (no doctor filter - for admin)
router.get(
  '/all',
  doctorConsultationsValidation.getAllConsultationsValidation,
  validate,
  doctorConsultationsController.getAllConsultations
);

// Get consultations by doctor (filters by specific doctor)
router.get(
  '/',
  doctorConsultationsValidation.getConsultationsByDoctorValidation,
  validate,
  doctorConsultationsController.getConsultationsByDoctor
);

// Get consultations by doctor ID (path parameter) - MUST be before /:id route
router.get(
  '/doctor/:doctorId',
  doctorConsultationsValidation.getConsultationsByDoctorIdValidation,
  validate,
  doctorConsultationsController.getConsultationsByDoctorId
);

// Get consultation by ID
router.get(
  '/:id',
  doctorConsultationsValidation.getConsultationByIdValidation,
  validate,
  doctorConsultationsController.getConsultationById
);

// All other routes require authentication and doctor role
router.use(authMiddleware);
router.use(isDoctor);

// Update consultation status
router.put(
  '/:id/status',
  doctorConsultationsValidation.updateConsultationStatusValidation,
  validate,
  doctorConsultationsController.updateConsultationStatus
);

module.exports = router;

