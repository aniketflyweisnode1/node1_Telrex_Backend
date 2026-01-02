const mongoose = require('mongoose');

const pushNotificationCampaignSchema = new mongoose.Schema(
  {
    // Push Notification Content
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    
    // Audience
    audience: {
      type: String,
      enum: ['all_mobile_users', 'active_patients', 'inactive_patients', 'custom'],
      default: 'all_mobile_users'
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
pushNotificationCampaignSchema.index({ status: 1 });
pushNotificationCampaignSchema.index({ scheduledAt: 1 });
pushNotificationCampaignSchema.index({ createdBy: 1 });
pushNotificationCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PushNotificationCampaign', pushNotificationCampaignSchema);

