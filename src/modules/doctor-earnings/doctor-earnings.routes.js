const express = require('express');
const router = express.Router();
const doctorEarningsController = require('./doctor-earnings.controller');
const doctorEarningsValidation = require('./doctor-earnings.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get doctor earnings summary
router.get(
  '/doctors/earnings',
  doctorEarningsValidation.getDoctorEarningsSummaryValidation,
  validate,
  doctorEarningsController.getDoctorEarningsSummary
);

// Get doctor earnings by ID
router.get('/doctors/:id/earnings', doctorEarningsController.getDoctorEarningsById);

// Get doctor bank account information (for payout processing)
router.get('/doctors/:id/bank-account', doctorEarningsController.getDoctorBankAccount);

// Process payout for a doctor
router.post(
  '/doctors/:id/payouts',
  doctorEarningsValidation.processPayoutValidation,
  validate,
  doctorEarningsController.processPayout
);

// Update payout status
router.put(
  '/payouts/:payoutId/status',
  doctorEarningsValidation.updatePayoutStatusValidation,
  validate,
  doctorEarningsController.updatePayoutStatus
);

module.exports = router;

