const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const reportsValidation = require('./reports.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Consultation Activity Routes
router.get(
  '/reports/consultation-activity',
  reportsValidation.getConsultationActivityValidation,
  validate,
  reportsController.getConsultationActivity
);
router.get(
  '/reports/consultation-activity/export',
  [...reportsValidation.getConsultationActivityValidation, ...reportsValidation.exportValidation],
  validate,
  reportsController.exportConsultationActivity
);

// Prescriptions & Orders Routes
router.get(
  '/reports/prescriptions-orders',
  reportsValidation.getPrescriptionsAndOrdersValidation,
  validate,
  reportsController.getPrescriptionsAndOrders
);
router.get(
  '/reports/prescriptions-orders/export',
  [...reportsValidation.getPrescriptionsAndOrdersValidation, ...reportsValidation.exportValidation],
  validate,
  reportsController.exportPrescriptionsAndOrders
);

// Financial Settlement Routes
router.get(
  '/reports/financial-settlement',
  reportsValidation.getFinancialSettlementValidation,
  validate,
  reportsController.getFinancialSettlement
);
router.get(
  '/reports/financial-settlement/export',
  [...reportsValidation.getFinancialSettlementValidation, ...reportsValidation.exportValidation],
  validate,
  reportsController.exportFinancialSettlement
);

// Pharmacy Inventory Routes
router.get(
  '/reports/pharmacy-inventory',
  reportsValidation.getPharmacyInventoryValidation,
  validate,
  reportsController.getPharmacyInventory
);
router.get(
  '/reports/pharmacy-inventory/export',
  [...reportsValidation.getPharmacyInventoryValidation, ...reportsValidation.exportValidation],
  validate,
  reportsController.exportPharmacyInventory
);

module.exports = router;

