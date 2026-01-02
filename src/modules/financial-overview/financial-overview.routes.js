const express = require('express');
const router = express.Router();
const financialOverviewController = require('./financial-overview.controller');
const financialOverviewValidation = require('./financial-overview.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get financial overview summary
router.get(
  '/financial-overview',
  financialOverviewValidation.getFinancialOverviewValidation,
  validate,
  financialOverviewController.getFinancialOverview
);

// Get revenue chart data
router.get(
  '/financial-overview/revenue-chart',
  financialOverviewValidation.getRevenueChartValidation,
  validate,
  financialOverviewController.getRevenueChart
);

// Get recent transactions
router.get(
  '/financial-overview/transactions',
  financialOverviewValidation.getRecentTransactionsValidation,
  validate,
  financialOverviewController.getRecentTransactions
);

module.exports = router;

