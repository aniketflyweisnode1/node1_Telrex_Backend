const pushNotificationCampaignService = require('./push-notification-campaign.service');

// Create push notification campaign
exports.createPushNotificationCampaign = async (req, res, next) => {
  try {
    const campaign = await pushNotificationCampaignService.createPushNotificationCampaign(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Push notification campaign created successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Get all push notification campaigns
exports.getAllPushNotificationCampaigns = async (req, res, next) => {
  try {
    const result = await pushNotificationCampaignService.getAllPushNotificationCampaigns(req.query);
    res.status(200).json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get push notification campaign by ID
exports.getPushNotificationCampaignById = async (req, res, next) => {
  try {
    const campaign = await pushNotificationCampaignService.getPushNotificationCampaignById(req.params.id);
    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Update push notification campaign
exports.updatePushNotificationCampaign = async (req, res, next) => {
  try {
    const campaign = await pushNotificationCampaignService.updatePushNotificationCampaign(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Push notification campaign updated successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Send push notification campaign
exports.sendPushNotificationCampaign = async (req, res, next) => {
  try {
    const result = await pushNotificationCampaignService.sendPushNotificationCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Push notification campaign sent successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (req, res, next) => {
  try {
    const result = await pushNotificationCampaignService.cancelScheduledCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Delete push notification campaign
exports.deletePushNotificationCampaign = async (req, res, next) => {
  try {
    const result = await pushNotificationCampaignService.deletePushNotificationCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

