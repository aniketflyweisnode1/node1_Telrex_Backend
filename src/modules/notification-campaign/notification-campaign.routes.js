const express = require('express');
const router = express.Router();
const notificationCampaignController = require('./notification-campaign.controller');
const notificationCampaignValidation = require('./notification-campaign.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const { uploadMultipleImages } = require('../../middlewares/upload.middleware');
const validate = require('../../middlewares/validate.middleware');

// Middleware to set campaignType based on route (only if not already set)
const setCampaignType = (type) => (req, res, next) => {
  // Initialize req.body if it doesn't exist (for GET requests)
  if (!req.body) {
    req.body = {};
  }
  // Initialize req.query if it doesn't exist
  if (!req.query) {
    req.query = {};
  }
  if (!req.body.campaignType) {
    req.body.campaignType = type;
  }
  // Always set query parameter for filtering (override any existing value)
  // This ensures the filter is applied in the service
  req.query.campaignType = type;
  next();
};

// Public tracking endpoints (no auth required - for email links and tracking pixels)
router.post('/notification-campaigns/:id/track/open', notificationCampaignController.trackCampaignOpen);
router.post('/notification-campaigns/:id/track/click', notificationCampaignController.trackCampaignClick);

// All other routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// ==================== TYPE-SPECIFIC ROUTES (Must come before unified routes) ====================

// ==================== EMAIL CAMPAIGNS ROUTES ====================

// Get all email campaigns
router.get('/email-campaigns', setCampaignType('email'), notificationCampaignController.getAllNotificationCampaigns);

// ==================== SMS CAMPAIGNS ROUTES ====================

// Get all SMS campaigns
router.get('/sms-campaigns', setCampaignType('sms'), notificationCampaignController.getAllNotificationCampaigns);

// ==================== PUSH NOTIFICATION CAMPAIGNS ROUTES ====================

// Get all push notification campaigns
router.get('/push-notification-campaigns', setCampaignType('push_notification'), notificationCampaignController.getAllNotificationCampaigns);

// ==================== UNIFIED NOTIFICATION CAMPAIGNS ROUTES ====================

// Create notification campaign (with optional image uploads for email)
router.post(
  '/notification-campaigns',
  uploadMultipleImages,
  notificationCampaignValidation.createNotificationCampaignValidation,
  validate,
  notificationCampaignController.createNotificationCampaign
);

// Get dashboard statistics
router.get('/notification-campaigns/statistics', notificationCampaignController.getDashboardStatistics);

// Get all notification campaigns (unified - returns all types unless filtered by query param)
router.get('/notification-campaigns', notificationCampaignController.getAllNotificationCampaigns);

// Get notification campaign by ID
router.get('/notification-campaigns/:id', notificationCampaignController.getNotificationCampaignById);

// Update notification campaign (with optional image uploads for email)
router.put(
  '/notification-campaigns/:id',
  uploadMultipleImages,
  notificationCampaignValidation.updateNotificationCampaignValidation,
  validate,
  notificationCampaignController.updateNotificationCampaign
);

// Send notification campaign
router.post('/notification-campaigns/:id/send', notificationCampaignController.sendNotificationCampaign);

// Cancel scheduled campaign
router.post('/notification-campaigns/:id/cancel', notificationCampaignController.cancelScheduledCampaign);

// Delete notification campaign
router.delete('/notification-campaigns/:id', notificationCampaignController.deleteNotificationCampaign);

// ==================== EMAIL CAMPAIGNS ROUTES (Type-Specific) ====================

// Create email campaign (auto-sets campaignType to 'email')
router.post(
  '/email-campaigns',
  setCampaignType('email'),
  uploadMultipleImages,
  notificationCampaignValidation.createNotificationCampaignValidation,
  validate,
  notificationCampaignController.createNotificationCampaign
);

// ==================== SMS CAMPAIGNS ROUTES (Type-Specific) ====================

// Create SMS campaign (auto-sets campaignType to 'sms')
router.post(
  '/sms-campaigns',
  setCampaignType('sms'),
  notificationCampaignValidation.createNotificationCampaignValidation,
  validate,
  notificationCampaignController.createNotificationCampaign
);

// ==================== PUSH NOTIFICATION CAMPAIGNS ROUTES (Type-Specific) ====================

// Create push notification campaign (auto-sets campaignType to 'push_notification')
router.post(
  '/push-notification-campaigns',
  setCampaignType('push_notification'),
  notificationCampaignValidation.createNotificationCampaignValidation,
  validate,
  notificationCampaignController.createNotificationCampaign
);

module.exports = router;

