const express = require('express');
const router = express.Router();
const supportSystemController = require('./support-system.controller');
const supportSystemValidation = require('./support-system.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

// Create support query
router.post(
  '/support-queries',
  supportSystemValidation.createSupportQueryValidation,
  validate,
  supportSystemController.createSupportQuery
);

// Get all support queries
router.get(
  '/support-queries',
  supportSystemValidation.getSupportQueriesValidation,
  validate,
  supportSystemController.getSupportQueries
);

// Get support query by ID
router.get(
  '/support-queries/:id',
  supportSystemValidation.supportQueryIdValidation,
  validate,
  supportSystemController.getSupportQueryById
);

// Send message to support query
router.post(
  '/support-queries/:id/messages',
  supportSystemValidation.supportQueryIdValidation,
  supportSystemValidation.sendMessageValidation,
  validate,
  supportSystemController.sendMessage
);

// Mark messages as read
router.put(
  '/support-queries/:id/read',
  supportSystemValidation.supportQueryIdValidation,
  validate,
  supportSystemController.markAsRead
);

// Close support query
router.put(
  '/support-queries/:id/close',
  supportSystemValidation.supportQueryIdValidation,
  validate,
  supportSystemController.closeSupportQuery
);

// Clear chat (Patient)
router.delete(
  '/support-queries/:id/clear-chat',
  supportSystemValidation.supportQueryIdValidation,
  validate,
  supportSystemController.clearChat
);

// Edit message (Patient)
router.put(
  '/support-queries/:id/messages/:messageId',
  supportSystemValidation.supportQueryIdValidation,
  supportSystemValidation.messageIdValidation,
  supportSystemValidation.editMessageValidation,
  validate,
  supportSystemController.editMessage
);

module.exports = router;

