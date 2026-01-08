const express = require('express');
const router = express.Router();
const supportSystemAdminController = require('./support-system-admin.controller');
const supportSystemAdminValidation = require('./support-system-admin.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get support system statistics
router.get(
  '/support-queries/statistics',
  supportSystemAdminController.getSupportStatistics
);

// Get assigned support queries (for logged-in admin/agent)
router.get(
  '/support-queries/assigned',
  supportSystemAdminValidation.getAllSupportQueriesValidation,
  validate,
  supportSystemAdminController.getAssignedSupportQueries
);

// Get all support queries
router.get(
  '/support-queries',
  supportSystemAdminValidation.getAllSupportQueriesValidation,
  validate,
  supportSystemAdminController.getAllSupportQueries
);

// Get support query by ID
router.get(
  '/support-queries/:id',
  supportSystemAdminValidation.supportQueryIdValidation,
  validate,
  supportSystemAdminController.getSupportQueryById
);

// Reply to support query
router.post(
  '/support-queries/:id/reply',
  supportSystemAdminValidation.supportQueryIdValidation,
  supportSystemAdminValidation.replyToSupportQueryValidation,
  validate,
  supportSystemAdminController.replyToSupportQuery
);

// Assign support query
router.put(
  '/support-queries/:id/assign',
  supportSystemAdminValidation.supportQueryIdValidation,
  supportSystemAdminValidation.assignSupportQueryValidation,
  validate,
  supportSystemAdminController.assignSupportQuery
);

// Update support query status
router.put(
  '/support-queries/:id/status',
  supportSystemAdminValidation.supportQueryIdValidation,
  supportSystemAdminValidation.updateSupportQueryStatusValidation,
  validate,
  supportSystemAdminController.updateSupportQueryStatus
);

// Mark messages as read (Admin/Support)
router.put(
  '/support-queries/:id/read',
  supportSystemAdminValidation.supportQueryIdValidation,
  validate,
  supportSystemAdminController.markAsRead
);

// Get patient profile by query ID (Admin)
router.get(
  '/support-queries/:id/patient-profile',
  supportSystemAdminValidation.supportQueryIdValidation,
  validate,
  supportSystemAdminController.getPatientProfileByQueryId
);

// Clear chat (Admin)
router.delete(
  '/support-queries/:id/clear-chat',
  supportSystemAdminValidation.supportQueryIdValidation,
  validate,
  supportSystemAdminController.clearChat
);

// Edit message (Admin)
router.put(
  '/support-queries/:id/messages/:messageId',
  supportSystemAdminValidation.supportQueryIdValidation,
  supportSystemAdminValidation.messageIdValidation,
  supportSystemAdminValidation.editMessageValidation,
  validate,
  supportSystemAdminController.editMessage
);

module.exports = router;

