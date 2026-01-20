const express = require('express');
const router = express.Router();
const complianceSecurityController = require('./compliance-security.controller');
const complianceSecurityValidation = require('./compliance-security.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// ==================== DASHBOARD ====================
router.get('/dashboard', complianceSecurityController.getDashboardStatistics);

// ==================== TWO-FACTOR AUTHENTICATION ====================
router.get('/2fa-statistics', complianceSecurityController.get2FAStatistics);

// ==================== AUDIT LOGS ====================

// Get all audit logs
router.get(
  '/audit-logs',
  complianceSecurityValidation.getAllAuditLogsValidation,
  validate,
  complianceSecurityController.getAllAuditLogs
);

// Get recent audit logs
router.get(
  '/audit-logs/recent',
  complianceSecurityController.getRecentAuditLogs
);

// Get audit log by ID
router.get(
  '/audit-logs/:id',
  complianceSecurityController.getAuditLogById
);

// Create audit log
router.post(
  '/audit-logs',
  complianceSecurityValidation.createAuditLogValidation,
  validate,
  complianceSecurityController.createAuditLog
);

// Delete audit log
router.delete(
  '/audit-logs/:id',
  complianceSecurityController.deleteAuditLog
);

// ==================== COMPLIANCE SETTINGS ====================

// Get all compliance settings
router.get(
  '/compliance-settings',
  complianceSecurityValidation.getAllComplianceSettingsValidation,
  validate,
  complianceSecurityController.getAllComplianceSettings
);

// Get compliance setting by type
router.get(
  '/compliance-settings/type/:type',
  complianceSecurityController.getComplianceSettingByType
);

// Get compliance setting by ID
router.get(
  '/compliance-settings/:id',
  complianceSecurityController.getComplianceSettingById
);

// Create compliance setting
router.post(
  '/compliance-settings',
  complianceSecurityValidation.createComplianceSettingValidation,
  validate,
  complianceSecurityController.createComplianceSetting
);

// Update compliance setting
router.put(
  '/compliance-settings/:id',
  complianceSecurityValidation.updateComplianceSettingValidation,
  validate,
  complianceSecurityController.updateComplianceSetting
);

// Delete compliance setting (soft delete)
router.delete(
  '/compliance-settings/:id',
  complianceSecurityController.deleteComplianceSetting
);

// Hard delete compliance setting (permanent delete)
router.delete(
  '/compliance-settings/:id/hard',
  complianceSecurityController.hardDeleteComplianceSetting
);

// ==================== SECURITY METRICS ====================

// Get all security metrics
router.get(
  '/security-metrics',
  complianceSecurityValidation.getAllSecurityMetricsValidation,
  validate,
  complianceSecurityController.getAllSecurityMetrics
);

// Get security metric by ID
router.get(
  '/security-metrics/:id',
  complianceSecurityController.getSecurityMetricById
);

// Create security metric
router.post(
  '/security-metrics',
  complianceSecurityValidation.createSecurityMetricValidation,
  validate,
  complianceSecurityController.createSecurityMetric
);

// Update security metric
router.put(
  '/security-metrics/:id',
  complianceSecurityValidation.updateSecurityMetricValidation,
  validate,
  complianceSecurityController.updateSecurityMetric
);

// Delete security metric (soft delete)
router.delete(
  '/security-metrics/:id',
  complianceSecurityController.deleteSecurityMetric
);

// Hard delete security metric (permanent delete)
router.delete(
  '/security-metrics/:id/hard',
  complianceSecurityController.hardDeleteSecurityMetric
);

module.exports = router;

