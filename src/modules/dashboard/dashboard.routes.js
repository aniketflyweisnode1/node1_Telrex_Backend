const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const dashboardValidation = require('./dashboard.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get Dashboard Data
router.get(
  '/dashboard',
  dashboardValidation.getDashboardDataValidation,
  validate,
  dashboardController.getDashboardData
);

// Get Revenue vs Payouts Chart
router.get(
  '/dashboard/revenue-vs-payouts',
  dashboardValidation.getRevenueVsPayoutsChartValidation,
  validate,
  dashboardController.getRevenueVsPayoutsChart
);

// Get AI Insights
router.get('/dashboard/ai-insights', dashboardController.getAIInsights);

// Get Recent Activity
router.get('/dashboard/recent-activity', dashboardController.getRecentActivity);

// Get Prescriptions By Region
router.get(
  '/dashboard/prescriptions-by-region',
  dashboardValidation.getDashboardDataValidation,
  validate,
  dashboardController.getPrescriptionsByRegion
);

module.exports = router;

