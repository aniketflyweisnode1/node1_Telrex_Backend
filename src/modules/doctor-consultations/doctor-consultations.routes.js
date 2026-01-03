const express = require('express');
const router = express.Router();
const doctorConsultationsController = require('./doctor-consultations.controller');
const doctorConsultationsValidation = require('./doctor-consultations.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isDoctor } = require('../../middlewares/doctor.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and doctor role
router.use(authMiddleware);
router.use(isDoctor);

// Get all consultations
router.get(
  '/',
  doctorConsultationsValidation.getConsultationsValidation,
  validate,
  doctorConsultationsController.getConsultations
);

// Get consultation by ID
router.get(
  '/:id',
  doctorConsultationsValidation.getConsultationByIdValidation,
  validate,
  doctorConsultationsController.getConsultationById
);

// Update consultation status
router.put(
  '/:id/status',
  doctorConsultationsValidation.updateConsultationStatusValidation,
  validate,
  doctorConsultationsController.updateConsultationStatus
);

module.exports = router;

