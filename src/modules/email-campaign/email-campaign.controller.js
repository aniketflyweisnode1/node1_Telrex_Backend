const emailCampaignService = require('./email-campaign.service');

// Create email campaign
exports.createEmailCampaign = async (req, res, next) => {
  try {
    const files = req.files || [];
    const campaign = await emailCampaignService.createEmailCampaign(req.body, files, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Email campaign created successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Get all email campaigns
exports.getAllEmailCampaigns = async (req, res, next) => {
  try {
    const result = await emailCampaignService.getAllEmailCampaigns(req.query);
    res.status(200).json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get email campaign by ID
exports.getEmailCampaignById = async (req, res, next) => {
  try {
    const campaign = await emailCampaignService.getEmailCampaignById(req.params.id);
    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Update email campaign
exports.updateEmailCampaign = async (req, res, next) => {
  try {
    const files = req.files || [];
    const campaign = await emailCampaignService.updateEmailCampaign(req.params.id, req.body, files);
    res.status(200).json({
      success: true,
      message: 'Email campaign updated successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Send email campaign
exports.sendEmailCampaign = async (req, res, next) => {
  try {
    const result = await emailCampaignService.sendEmailCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Email campaign sent successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Delete email campaign
exports.deleteEmailCampaign = async (req, res, next) => {
  try {
    const result = await emailCampaignService.deleteEmailCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (req, res, next) => {
  try {
    const result = await emailCampaignService.cancelScheduledCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

