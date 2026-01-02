const express = require('express');
const router = express.Router();
const emailCampaignController = require('./email-campaign.controller');
const emailCampaignValidation = require('./email-campaign.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const { uploadMultipleImages } = require('../../middlewares/upload.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Create email campaign (with multiple image uploads)
router.post(
  '/email-campaigns',
  uploadMultipleImages,
  emailCampaignValidation.createEmailCampaignValidation,
  validate,
  emailCampaignController.createEmailCampaign
);

// Get all email campaigns
router.get('/email-campaigns', emailCampaignController.getAllEmailCampaigns);

// Get email campaign by ID
router.get('/email-campaigns/:id', emailCampaignController.getEmailCampaignById);

// Update email campaign (with optional image uploads)
router.put(
  '/email-campaigns/:id',
  uploadMultipleImages,
  emailCampaignValidation.updateEmailCampaignValidation,
  validate,
  emailCampaignController.updateEmailCampaign
);

// Send email campaign
router.post('/email-campaigns/:id/send', emailCampaignController.sendEmailCampaign);

// Cancel scheduled campaign
router.post('/email-campaigns/:id/cancel', emailCampaignController.cancelScheduledCampaign);

// Delete email campaign
router.delete('/email-campaigns/:id', emailCampaignController.deleteEmailCampaign);

module.exports = router;

