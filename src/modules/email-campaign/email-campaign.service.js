const EmailCampaign = require('../../models/EmailCampaign.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
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

// Get recipients based on audience
const getRecipients = async (audience, customRecipients = []) => {
  let patients = [];
  
  switch (audience) {
    case 'all_patients':
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
  
  // Filter patients with valid email addresses
  return patients.filter(patient => patient.user && patient.user.email);
};

// Create email campaign
exports.createEmailCampaign = async (data, files = [], userId) => {
  // Prepare images from uploaded files
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
    images: images,
    subject: data.subject,
    message: data.message,
    audience: data.audience || 'all_patients',
    customRecipients: data.customRecipients || [],
    scheduleType: data.scheduleType || 'send_now',
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    status: data.scheduleType === 'scheduled' ? 'scheduled' : 'draft',
    createdBy: userId
  };

  // If send now, calculate recipients count
  if (campaignData.scheduleType === 'send_now') {
    const recipients = await getRecipients(campaignData.audience, campaignData.customRecipients);
    campaignData.totalRecipients = recipients.length;
  }

  const campaign = await EmailCampaign.create(campaignData);
  return campaign;
};

// Get all email campaigns
exports.getAllEmailCampaigns = async (query = {}) => {
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
  const campaigns = await EmailCampaign.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await EmailCampaign.countDocuments(filter);

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

// Get email campaign by ID
exports.getEmailCampaignById = async (campaignId) => {
  const campaign = await EmailCampaign.findById(campaignId)
    .populate('createdBy', 'firstName lastName email')
    .populate('customRecipients', 'user')
    .lean();
  
  if (!campaign) {
    throw new AppError('Email campaign not found', 404);
  }
  
  return campaign;
};

// Update email campaign
exports.updateEmailCampaign = async (campaignId, data, files = []) => {
  const campaign = await EmailCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Email campaign not found', 404);
  }

  // Can't update if already sent
  if (campaign.status === 'sent') {
    throw new AppError('Cannot update a campaign that has already been sent', 400);
  }

  // Update fields
  if (data.subject !== undefined) campaign.subject = data.subject;
  if (data.message !== undefined) campaign.message = data.message;
  if (data.audience !== undefined) campaign.audience = data.audience;
  if (data.customRecipients !== undefined) campaign.customRecipients = data.customRecipients;
  if (data.scheduleType !== undefined) campaign.scheduleType = data.scheduleType;
  if (data.scheduledAt !== undefined) {
    campaign.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  }

  // Add new images if provided
  if (files && files.length > 0) {
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

// Send email campaign
exports.sendEmailCampaign = async (campaignId) => {
  const campaign = await EmailCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Email campaign not found', 404);
  }

  if (campaign.status === 'sent') {
    throw new AppError('Campaign has already been sent', 400);
  }

  if (campaign.status === 'sending') {
    throw new AppError('Campaign is currently being sent', 400);
  }

  // Get recipients
  const recipients = await getRecipients(campaign.audience, campaign.customRecipients);
  
  if (recipients.length === 0) {
    throw new AppError('No recipients found for this campaign', 400);
  }

  // Update campaign status
  campaign.status = 'sending';
  campaign.totalRecipients = recipients.length;
  campaign.sentAt = new Date();
  await campaign.save();

  // Send emails
  let sentCount = 0;
  let failedCount = 0;

  try {
    const transporter = createTransporter();
    
    // Build HTML with images
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

    // Send to each recipient
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

    // Update campaign status
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

// Delete email campaign
exports.deleteEmailCampaign = async (campaignId) => {
  const campaign = await EmailCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Email campaign not found', 404);
  }

  // Can't delete if already sent
  if (campaign.status === 'sent' || campaign.status === 'sending') {
    throw new AppError('Cannot delete a campaign that has been sent or is being sent', 400);
  }

  await EmailCampaign.findByIdAndDelete(campaignId);
  
  return { message: 'Email campaign deleted successfully' };
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (campaignId) => {
  const campaign = await EmailCampaign.findById(campaignId);
  
  if (!campaign) {
    throw new AppError('Email campaign not found', 404);
  }

  if (campaign.status !== 'scheduled') {
    throw new AppError('Only scheduled campaigns can be cancelled', 400);
  }

  campaign.status = 'cancelled';
  await campaign.save();
  
  return { message: 'Scheduled campaign cancelled successfully' };
};

