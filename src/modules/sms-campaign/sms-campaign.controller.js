const smsCampaignService = require('./sms-campaign.service');

// Create SMS campaign
exports.createSMSCampaign = async (req, res, next) => {
  try {
    const campaign = await smsCampaignService.createSMSCampaign(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'SMS campaign created successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Get all SMS campaigns
exports.getAllSMSCampaigns = async (req, res, next) => {
  try {
    const result = await smsCampaignService.getAllSMSCampaigns(req.query);
    res.status(200).json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get SMS campaign by ID
exports.getSMSCampaignById = async (req, res, next) => {
  try {
    const campaign = await smsCampaignService.getSMSCampaignById(req.params.id);
    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Update SMS campaign
exports.updateSMSCampaign = async (req, res, next) => {
  try {
    const campaign = await smsCampaignService.updateSMSCampaign(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'SMS campaign updated successfully',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
};

// Send SMS campaign
exports.sendSMSCampaign = async (req, res, next) => {
  try {
    const result = await smsCampaignService.sendSMSCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: 'SMS campaign sent successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (req, res, next) => {
  try {
    const result = await smsCampaignService.cancelScheduledCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Delete SMS campaign
exports.deleteSMSCampaign = async (req, res, next) => {
  try {
    const result = await smsCampaignService.deleteSMSCampaign(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

