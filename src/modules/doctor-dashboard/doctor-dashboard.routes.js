const express = require('express');
const router = express.Router();
const doctorDashboardController = require('./doctor-dashboard.controller');
const doctorDashboardValidation = require('./doctor-dashboard.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isDoctor } = require('../../middlewares/doctor.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and doctor role
router.use(authMiddleware);
router.use(isDoctor);

// Get Dashboard Overview (metrics)
router.get(
  '/overview',
  doctorDashboardValidation.getDashboardOverviewValidation,
  validate,
  doctorDashboardController.getDashboardOverview
);

// Get Recent Consultations
router.get(
  '/recent-consultations',
  doctorDashboardValidation.getRecentConsultationsValidation,
  validate,
  doctorDashboardController.getRecentConsultations
);

// Get Today's Schedule
router.get(
  '/todays-schedule',
  doctorDashboardValidation.getTodaysScheduleValidation,
  validate,
  doctorDashboardController.getTodaysSchedule
);

module.exports = router;

