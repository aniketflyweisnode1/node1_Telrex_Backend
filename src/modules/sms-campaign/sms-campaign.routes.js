const express = require('express');
const router = express.Router();
const smsCampaignController = require('./sms-campaign.controller');
const smsCampaignValidation = require('./sms-campaign.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Create SMS campaign
router.post(
  '/sms-campaigns',
  smsCampaignValidation.createSMSCampaignValidation,
  validate,
  smsCampaignController.createSMSCampaign
);

// Get all SMS campaigns
router.get('/sms-campaigns', smsCampaignController.getAllSMSCampaigns);

// Get SMS campaign by ID
router.get('/sms-campaigns/:id', smsCampaignController.getSMSCampaignById);

// Update SMS campaign
router.put(
  '/sms-campaigns/:id',
  smsCampaignValidation.updateSMSCampaignValidation,
  validate,
  smsCampaignController.updateSMSCampaign
);

// Send SMS campaign
router.post('/sms-campaigns/:id/send', smsCampaignController.sendSMSCampaign);

// Cancel scheduled campaign
router.post('/sms-campaigns/:id/cancel', smsCampaignController.cancelScheduledCampaign);

// Delete SMS campaign
router.delete('/sms-campaigns/:id', smsCampaignController.deleteSMSCampaign);

module.exports = router;

