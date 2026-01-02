const mongoose = require('mongoose');

const notificationCampaignSchema = new mongoose.Schema(
  {
    // Campaign Name
    campaignName: {
      type: String,
      required: true,
      trim: true
    },
    
    // Campaign Type
    campaignType: {
      type: String,
      enum: ['email', 'sms', 'push_notification'],
      required: true
    },
    
    // Email-specific fields
    images: [{
      fileName: {
        type: String
      },
      fileUrl: {
        type: String
      },
      fileType: {
        type: String
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    subject: {
      type: String,
      trim: true
    },
    
    // Push Notification-specific fields
    title: {
      type: String,
      trim: true
    },
    
    // Common fields
    message: {
      type: String,
      required: true
    },
    
    // Audience
    audience: {
      type: String,
      enum: ['all_patients', 'active_patients', 'inactive_patients', 'all_mobile_users', 'custom'],
      default: 'all_patients'
    },
    customRecipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    }],
    
    // Schedule
    scheduleType: {
      type: String,
      enum: ['send_now', 'scheduled'],
      default: 'send_now'
    },
    scheduledAt: {
      type: Date
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'draft'
    },
    
    // Sending Statistics
    totalRecipients: {
      type: Number,
      default: 0
    },
    sentCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    
    // Tracking Statistics (for Email and Push Notifications)
    openedCount: {
      type: Number,
      default: 0
    },
    openedRate: {
      type: Number,
      default: 0
    },
    clickedCount: {
      type: Number,
      default: 0
    },
    clickedRate: {
      type: Number,
      default: 0
    },
    
    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Sent at
    sentAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Indexes
notificationCampaignSchema.index({ campaignType: 1, status: 1 });
notificationCampaignSchema.index({ status: 1 });
notificationCampaignSchema.index({ scheduledAt: 1 });
notificationCampaignSchema.index({ createdBy: 1 });
notificationCampaignSchema.index({ createdAt: -1 });
notificationCampaignSchema.index({ campaignName: 'text' });

// Validation: Email campaigns require subject
notificationCampaignSchema.pre('validate', function(next) {
  if (this.campaignType === 'email' && !this.subject) {
    return next(new Error('Subject is required for email campaigns'));
  }
  // Push notification campaigns require title
  if (this.campaignType === 'push_notification' && !this.title) {
    return next(new Error('Title is required for push notification campaigns'));
  }
  // SMS campaigns have 160 character limit
  if (this.campaignType === 'sms' && this.message && this.message.length > 160) {
    return next(new Error('SMS message must be 160 characters or less'));
  }
  next();
});

module.exports = mongoose.model('NotificationCampaign', notificationCampaignSchema);

