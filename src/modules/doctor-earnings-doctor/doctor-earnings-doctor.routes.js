const express = require('express');
const router = express.Router();
const doctorEarningsController = require('./doctor-earnings-doctor.controller');
const doctorEarningsValidation = require('./doctor-earnings-doctor.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isDoctor } = require('../../middlewares/doctor.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and doctor role
router.use(authMiddleware);
router.use(isDoctor);

// Get earnings summary
router.get(
  '/summary',
  doctorEarningsValidation.getEarningsSummaryValidation,
  validate,
  doctorEarningsController.getEarningsSummary
);

// Get payout requests
router.get(
  '/payouts',
  doctorEarningsValidation.getPayoutRequestsValidation,
  validate,
  doctorEarningsController.getPayoutRequests
);

// Get payout request by ID
router.get(
  '/payouts/:id',
  doctorEarningsController.getPayoutRequestById
);

// Create payout request
router.post(
  '/payouts',
  doctorEarningsValidation.createPayoutRequestValidation,
  validate,
  doctorEarningsController.createPayoutRequest
);

// Get reports & analytics
router.get(
  '/reports',
  doctorEarningsValidation.getReportsAndAnalyticsValidation,
  validate,
  doctorEarningsController.getReportsAndAnalytics
);

module.exports = router;

