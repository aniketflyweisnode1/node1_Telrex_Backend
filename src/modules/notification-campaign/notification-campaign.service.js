const NotificationCampaign = require('../../models/NotificationCampaign.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const Notification = require('../../models/Notification.model');
const AppError = require('../../utils/AppError');
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Get recipients based on audience and campaign type
const getRecipients = async (campaignType, audience, customRecipients = []) => {
  let patients = [];
  
  switch (audience) {
    case 'all_patients':
      patients = await Patient.find({ isActive: true }).populate('user', 'email phoneNumber firstName lastName');
      break;
    case 'active_patients':
      patients = await Patient.find({ isActive: true }).populate('user', 'email phoneNumber firstName lastName');
      break;
    case 'inactive_patients':
      patients = await Patient.find({ isActive: false }).populate('user', 'email phoneNumber firstName lastName');
      break;
    case 'all_mobile_users':
      patients = await Patient.find({ isActive: true }).populate('user', 'email phoneNumber firstName lastName');
      break;
    case 'custom':
      if (!customRecipients || customRecipients.length === 0) {
        throw new AppError('Custom recipients are required when audience is custom', 400);
      }
      patients = await Patient.find({ 
        _id: { $in: customRecipients },
        isActive: true 
      }).populate('user', 'email phoneNumber firstName lastName');
      break;
    default:
      patients = await Patient.find({ isActive: true }).populate('user', 'email phoneNumber firstName lastName');
  }
  
  // Filter based on campaign type
  if (campaignType === 'email') {
    return patients.filter(patient => patient.user && patient.user.email);
  } else if (campaignType === 'sms') {
    return patients.filter(patient => patient.user && patient.user.phoneNumber);
  } else if (campaignType === 'push_notification') {
    return patients.filter(patient => patient.user);
  }
  
  return patients;
};

// Create notification campaign
exports.createNotificationCampaign = async (data, files = [], userId) => {
  // Prepare images for email campaigns
  const images = files.map(file => {
    const fileUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
    return {
      fileName: file.filename,
      fileUrl: fileUrl,
      fileType: file.mimetype,
      uploadedAt: new Date()
    };
  });

  const campaignData = {
    campaignName: data.campaignName,
    campaignType: data.campaignType,
    images: data.campaignType === 'email' ? images : [],
    subject: data.subject || null,
    title: data.title || null,
    message: data.message,
    audience: data.audience || (data.campaignType === 'push_notification' ? 'all_mobile_users' : 'all_patients'),
    customRecipients: data.customRecipients || [],
    scheduleType: data.scheduleType || 'send_now',
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    status: data.scheduleType === 'scheduled' ? 'scheduled' : 'draft',
    createdBy: userId,
    openedCount: 0,
    openedRate: 0,
    clickedCount: 0,
    clickedRate: 0
  };

  // If send now, calculate recipients count
  if (campaignData.scheduleType === 'send_now') {
    const recipients = await getRecipients(campaignData.campaignType, campaignData.audience, campaignData.customRecipients);
    campaignData.totalRecipients = recipients.length;
  }

  const campaign = await NotificationCampaign.create(campaignData);
  return campaign;
};

// Get all notification campaigns
exports.getAllNotificationCampaigns = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    audience,
    campaignType
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (audience) {
    filter.audience = audience;
  }

  // Always filter by campaignType if provided
  // This is critical for type-specific routes (email-campaigns, sms-campaigns, etc.)
  if (campaignType) {
    const trimmedType = String(campaignType).trim();
    if (trimmedType) {
      filter.campaignType = trimmedType;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const campaigns = await NotificationCampaign.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await NotificationCampaign.countDocuments(filter);

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

// Get notification campaign by ID
exports.getNotificationCampaignById = async (campaignId) => {
  const campaign = await NotificationCampaign.findById(campaignId)
    .populate('createdBy', 'firstName lastName email')
    .populate('customRecipients', 'user')
    .lean();
  
  if (!campaign) {
    throw new AppError('Notification campaign not found', 404);
  }
  
  return campaign;
};

// Update notification campaign
exports.updateNotificationCampaign = async (campaignId, data, files = []) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Notification campaign not found', 404);
  }

  if (campaign.status === 'sent') {
    throw new AppError('Cannot update a campaign that has already been sent', 400);
  }

  // Update fields
  if (data.campaignName !== undefined) campaign.campaignName = data.campaignName;
  if (data.campaignType !== undefined) campaign.campaignType = data.campaignType;
  if (data.subject !== undefined) campaign.subject = data.subject;
  if (data.title !== undefined) campaign.title = data.title;
  if (data.message !== undefined) campaign.message = data.message;
  if (data.audience !== undefined) campaign.audience = data.audience;
  if (data.customRecipients !== undefined) campaign.customRecipients = data.customRecipients;
  if (data.scheduleType !== undefined) campaign.scheduleType = data.scheduleType;
  if (data.scheduledAt !== undefined) {
    campaign.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  }

  // Add new images if provided (only for email campaigns)
  if (files && files.length > 0 && campaign.campaignType === 'email') {
    const newImages = files.map(file => {
      const fileUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
      return {
        fileName: file.filename,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        uploadedAt: new Date()
      };
    });
    campaign.images.push(...newImages);
  }

  // Update status based on schedule type
  if (data.scheduleType === 'scheduled' && campaign.scheduledAt) {
    campaign.status = 'scheduled';
  } else if (data.scheduleType === 'send_now') {
    campaign.status = 'draft';
  }

  await campaign.save();
  return campaign;
};

// Send notification campaign
exports.sendNotificationCampaign = async (campaignId) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Notification campaign not found', 404);
  }

  if (campaign.status === 'sent') {
    throw new AppError('Campaign has already been sent', 400);
  }

  if (campaign.status === 'sending') {
    throw new AppError('Campaign is currently being sent', 400);
  }

  const recipients = await getRecipients(campaign.campaignType, campaign.audience, campaign.customRecipients);
  
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
    if (campaign.campaignType === 'email') {
      // Send emails
      const transporter = createTransporter();
      
      let imageHtml = '';
      if (campaign.images && campaign.images.length > 0) {
        imageHtml = campaign.images.map(img => 
          `<img src="${img.fileUrl}" alt="Campaign Image" style="max-width: 100%; margin: 10px 0;" />`
        ).join('');
      }

      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${imageHtml}
          <div style="margin-top: 20px;">
            ${campaign.message.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Telerxs. Please do not reply.</p>
        </div>
      `;

      for (const patient of recipients) {
        try {
          const mailOptions = {
            from: process.env.FROM_EMAIL || 'no-reply@telerxs.com',
            to: patient.user.email,
            subject: campaign.subject,
            html: htmlMessage
          };

          await transporter.sendMail(mailOptions);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send email to ${patient.user.email}:`, error);
          failedCount++;
        }
      }
    } else if (campaign.campaignType === 'sms') {
      // Send SMS
      for (const patient of recipients) {
        try {
          // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
          console.log(`📱 SMS to ${patient.user.phoneNumber}: ${campaign.message}`);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send SMS to ${patient.user.phoneNumber}:`, error);
          failedCount++;
        }
      }
    } else if (campaign.campaignType === 'push_notification') {
      // Send push notifications
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
          console.log(`🔔 Push notification to ${patient.user.email}: ${campaign.title}`);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send push notification to ${patient.user.email}:`, error);
          failedCount++;
        }
      }
    }

    // Calculate opened and clicked rates (for email and push notifications)
    if (campaign.campaignType === 'email' || campaign.campaignType === 'push_notification') {
      // These will be updated when tracking events occur
      campaign.openedCount = 0;
      campaign.openedRate = 0;
      campaign.clickedCount = 0;
      campaign.clickedRate = 0;
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

// Delete notification campaign
exports.deleteNotificationCampaign = async (campaignId) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Notification campaign not found', 404);
  }

  if (campaign.status === 'sent' || campaign.status === 'sending') {
    throw new AppError('Cannot delete a campaign that has been sent or is being sent', 400);
  }

  await NotificationCampaign.findByIdAndDelete(campaignId);
  
  return { message: 'Notification campaign deleted successfully' };
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (campaignId) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Notification campaign not found', 404);
  }

  if (campaign.status !== 'scheduled') {
    throw new AppError('Only scheduled campaigns can be cancelled', 400);
  }

  campaign.status = 'cancelled';
  await campaign.save();
  
  return { message: 'Scheduled campaign cancelled successfully' };
};

// Get dashboard statistics
exports.getDashboardStatistics = async () => {
  const totalCampaigns = await NotificationCampaign.countDocuments();
  const scheduledCampaigns = await NotificationCampaign.countDocuments({ status: 'scheduled' });
  
  // Get active patients count
  const activePatients = await Patient.countDocuments({ isActive: true });
  
  // Calculate average open rate (for email and push notifications)
  const emailAndPushCampaigns = await NotificationCampaign.find({
    campaignType: { $in: ['email', 'push_notification'] },
    status: 'sent',
    sentCount: { $gt: 0 }
  }).lean();
  
  let totalOpenRate = 0;
  let campaignsWithOpenRate = 0;
  
  emailAndPushCampaigns.forEach(campaign => {
    if (campaign.openedRate > 0) {
      totalOpenRate += campaign.openedRate;
      campaignsWithOpenRate++;
    }
  });
  
  const avgOpenRate = campaignsWithOpenRate > 0 
    ? Math.round((totalOpenRate / campaignsWithOpenRate) * 100) / 100 
    : 0;
  
  return {
    totalCampaigns,
    activeSubscribers: activePatients,
    avgOpenRate: avgOpenRate,
    scheduled: scheduledCampaigns
  };
};

// Track campaign open (for email and push notifications)
exports.trackCampaignOpen = async (campaignId) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  
  if (campaign.campaignType === 'sms') {
    throw new AppError('Open tracking is not available for SMS campaigns', 400);
  }
  
  // Increment opened count
  campaign.openedCount = (campaign.openedCount || 0) + 1;
  
  // Calculate opened rate
  if (campaign.sentCount > 0) {
    campaign.openedRate = Math.round((campaign.openedCount / campaign.sentCount) * 100 * 100) / 100;
  }
  
  await campaign.save();
  return campaign;
};

// Track campaign click (for email and push notifications)
exports.trackCampaignClick = async (campaignId) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  
  if (campaign.campaignType === 'sms') {
    throw new AppError('Click tracking is not available for SMS campaigns', 400);
  }
  
  // Increment clicked count
  campaign.clickedCount = (campaign.clickedCount || 0) + 1;
  
  // Calculate clicked rate
  if (campaign.sentCount > 0) {
    campaign.clickedRate = Math.round((campaign.clickedCount / campaign.sentCount) * 100 * 100) / 100;
  }
  
  await campaign.save();
  return campaign;
};

