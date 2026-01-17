const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams: true to access parent route params
const adminPatientTransactionController = require('./admin-patient-transaction.controller');
const adminPatientTransactionValidation = require('./admin-patient-transaction.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get transaction history for a patient
router.get(
  '/',
  adminPatientTransactionValidation.getTransactionHistoryValidation,
  validate,
  adminPatientTransactionController.getTransactionHistory
);

// Get transaction by ID for a patient
router.get(
  '/:transactionId',
  adminPatientTransactionValidation.getTransactionByIdValidation,
  validate,
  adminPatientTransactionController.getTransactionById
);

// Get invoice for a transaction
router.get(
  '/:transactionId/invoice',
  adminPatientTransactionValidation.getTransactionByIdValidation,
  validate,
  adminPatientTransactionController.getTransactionInvoice
);

module.exports = router;

