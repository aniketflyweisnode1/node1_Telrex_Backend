const PushNotificationCampaign = require('../../models/PushNotificationCampaign.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const Notification = require('../../models/Notification.model');
const AppError = require('../../utils/AppError');

// Get recipients based on audience
const getRecipients = async (audience, customRecipients = []) => {
  let patients = [];
  
  switch (audience) {
    case 'all_mobile_users':
      patients = await Patient.find({ isActive: true }).populate('user', 'email firstName lastName');
      break;
    case 'active_patients':
      patients = await Patient.find({ isActive: true }).populate('user', 'email firstName lastName');
      break;
    case 'inactive_patients':
      patients = await Patient.find({ isActive: false }).populate('user', 'email firstName lastName');
      break;
    case 'custom':
      if (!customRecipients || customRecipients.length === 0) {
        throw new AppError('Custom recipients are required when audience is custom', 400);
      }
      patients = await Patient.find({ 
        _id: { $in: customRecipients },
        isActive: true 
      }).populate('user', 'email firstName lastName');
      break;
    default:
      patients = await Patient.find({ isActive: true }).populate('user', 'email firstName lastName');
  }
  
  return patients.filter(patient => patient.user);
};

// Create push notification campaign
exports.createPushNotificationCampaign = async (data, userId) => {
  const campaignData = {
    title: data.title,
    message: data.message,
    audience: data.audience || 'all_mobile_users',
    customRecipients: data.customRecipients || [],
    scheduleType: data.scheduleType || 'send_now',
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    status: data.scheduleType === 'scheduled' ? 'scheduled' : 'draft',
    createdBy: userId
  };

  if (campaignData.scheduleType === 'send_now') {
    const recipients = await getRecipients(campaignData.audience, campaignData.customRecipients);
    campaignData.totalRecipients = recipients.length;
  }

  const campaign = await PushNotificationCampaign.create(campaignData);
  return campaign;
};

// Get all push notification campaigns
exports.getAllPushNotificationCampaigns = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    audience
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (audience) {
    filter.audience = audience;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const campaigns = await PushNotificationCampaign.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await PushNotificationCampaign.countDocuments(filter);

  return {
    campaigns,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get push notification campaign by ID
exports.getPushNotificationCampaignById = async (campaignId) => {
  const campaign = await PushNotificationCampaign.findById(campaignId)
    .populate('createdBy', 'firstName lastName email')
    .populate('customRecipients', 'user')
    .lean();
  
  if (!campaign) {
    throw new AppError('Push notification campaign not found', 404);
  }
  
  return campaign;
};

// Update push notification campaign
exports.updatePushNotificationCampaign = async (campaignId, data) => {
  const campaign = await PushNotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Push notification campaign not found', 404);
  }

  if (campaign.status === 'sent') {
    throw new AppError('Cannot update a campaign that has already been sent', 400);
  }

  if (data.title !== undefined) campaign.title = data.title;
  if (data.message !== undefined) campaign.message = data.message;
  if (data.audience !== undefined) campaign.audience = data.audience;
  if (data.customRecipients !== undefined) campaign.customRecipients = data.customRecipients;
  if (data.scheduleType !== undefined) campaign.scheduleType = data.scheduleType;
  if (data.scheduledAt !== undefined) {
    campaign.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  }

  if (data.scheduleType === 'scheduled' && campaign.scheduledAt) {
    campaign.status = 'scheduled';
  } else if (data.scheduleType === 'send_now') {
    campaign.status = 'draft';
  }

  await campaign.save();
  return campaign;
};

// Send push notification campaign
exports.sendPushNotificationCampaign = async (campaignId) => {
  const campaign = await PushNotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Push notification campaign not found', 404);
  }

  if (campaign.status === 'sent') {
    throw new AppError('Campaign has already been sent', 400);
  }

  if (campaign.status === 'sending') {
    throw new AppError('Campaign is currently being sent', 400);
  }

  const recipients = await getRecipients(campaign.audience, campaign.customRecipients);
  
  if (recipients.length === 0) {
    throw new AppError('No recipients found for this campaign', 400);
  }

  campaign.status = 'sending';
  campaign.totalRecipients = recipients.length;
  campaign.sentAt = new Date();
  await campaign.save();

  let sentCount = 0;
  let failedCount = 0;

  try {
    // Create notifications for each recipient
    for (const patient of recipients) {
      try {
        await Notification.create({
          user: patient.user._id,
          type: 'system',
          title: campaign.title,
          message: campaign.message,
          isRead: false
        });
        
        // TODO: Send actual push notification via FCM/APNS
        // Example: await pushService.sendPushNotification(patient.user._id, campaign.title, campaign.message);
        console.log(`🔔 Push notification to ${patient.user.email}: ${campaign.title}`);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send push notification to ${patient.user.email}:`, error);
        failedCount++;
      }
    }

    campaign.status = 'sent';
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    await campaign.save();

    return {
      success: true,
      totalRecipients: recipients.length,
      sentCount,
      failedCount
    };
  } catch (error) {
    campaign.status = 'failed';
    await campaign.save();
    throw new AppError(`Failed to send campaign: ${error.message}`, 500);
  }
};

// Delete push notification campaign
exports.deletePushNotificationCampaign = async (campaignId) => {
  const campaign = await PushNotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Push notification campaign not found', 404);
  }

  if (campaign.status === 'sent' || campaign.status === 'sending') {
    throw new AppError('Cannot delete a campaign that has been sent or is being sent', 400);
  }

  await PushNotificationCampaign.findByIdAndDelete(campaignId);
  
  return { message: 'Push notification campaign deleted successfully' };
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (campaignId) => {
  const campaign = await PushNotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Push notification campaign not found', 404);
  }

  if (campaign.status !== 'scheduled') {
    throw new AppError('Only scheduled campaigns can be cancelled', 400);
  }

  campaign.status = 'cancelled';
  await campaign.save();
  
  return { message: 'Scheduled campaign cancelled successfully' };
};

