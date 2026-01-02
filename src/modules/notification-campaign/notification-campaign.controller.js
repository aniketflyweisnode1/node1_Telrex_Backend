const notificationCampaignService = require('./notification-campaign.service');

// Create notification campaign
exports.createNotificationCampaign = async (req, res, next) => {
  try {
    const files = req.files || [];
    const campaign = await notificationCampaignService.createNotificationCampaign(req.body, files, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Notification campaign created successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Get all notification campaigns
exports.getAllNotificationCampaigns = async (req, res, next) => {
  try {
    const result = await notificationCampaignService.getAllNotificationCampaigns(req.query);
    res.status(200).json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get notification campaign by ID
exports.getNotificationCampaignById = async (req, res, next) => {
  try {
    const campaign = await notificationCampaignService.getNotificationCampaignById(req.params.id);
    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Update notification campaign
exports.updateNotificationCampaign = async (req, res, next) => {
  try {
    const files = req.files || [];
    const campaign = await notificationCampaignService.updateNotificationCampaign(req.params.id, req.body, files);
    res.status(200).json({
      success: true,
      message: 'Notification campaign updated successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Send notification campaign
exports.sendNotificationCampaign = async (req, res, next) => {
  try {
    const result = await notificationCampaignService.sendNotificationCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification campaign sent successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (req, res, next) => {
  try {
    const result = await notificationCampaignService.cancelScheduledCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Delete notification campaign
exports.deleteNotificationCampaign = async (req, res, next) => {
  try {
    const result = await notificationCampaignService.deleteNotificationCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Get dashboard statistics
exports.getDashboardStatistics = async (req, res, next) => {
  try {
    const statistics = await notificationCampaignService.getDashboardStatistics();
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

// Track campaign open
exports.trackCampaignOpen = async (req, res, next) => {
  try {
    const campaign = await notificationCampaignService.trackCampaignOpen(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Campaign open tracked successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Track campaign click
exports.trackCampaignClick = async (req, res, next) => {
  try {
    const campaign = await notificationCampaignService.trackCampaignClick(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Campaign click tracked successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

