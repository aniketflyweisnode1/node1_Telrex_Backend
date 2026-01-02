const express = require('express');
const router = express.Router();
const pushNotificationCampaignController = require('./push-notification-campaign.controller');
const pushNotificationCampaignValidation = require('./push-notification-campaign.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Create push notification campaign
router.post(
  '/push-notification-campaigns',
  pushNotificationCampaignValidation.createPushNotificationCampaignValidation,
  validate,
  pushNotificationCampaignController.createPushNotificationCampaign
);

// Get all push notification campaigns
router.get('/push-notification-campaigns', pushNotificationCampaignController.getAllPushNotificationCampaigns);

// Get push notification campaign by ID
router.get('/push-notification-campaigns/:id', pushNotificationCampaignController.getPushNotificationCampaignById);

// Update push notification campaign
router.put(
  '/push-notification-campaigns/:id',
  pushNotificationCampaignValidation.updatePushNotificationCampaignValidation,
  validate,
  pushNotificationCampaignController.updatePushNotificationCampaign
);

// Send push notification campaign
router.post('/push-notification-campaigns/:id/send', pushNotificationCampaignController.sendPushNotificationCampaign);

// Cancel scheduled campaign
router.post('/push-notification-campaigns/:id/cancel', pushNotificationCampaignController.cancelScheduledCampaign);

// Delete push notification campaign
router.delete('/push-notification-campaigns/:id', pushNotificationCampaignController.deletePushNotificationCampaign);

module.exports = router;

