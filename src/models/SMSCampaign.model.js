const mongoose = require('mongoose');

const smsCampaignSchema = new mongoose.Schema(
  {
    // SMS Content
    message: {
      type: String,
      required: true,
      maxlength: 160
    },
    
    // Audience
    audience: {
      type: String,
      enum: ['all_patients', 'active_patients', 'inactive_patients', 'custom'],
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
smsCampaignSchema.index({ status: 1 });
smsCampaignSchema.index({ scheduledAt: 1 });
smsCampaignSchema.index({ createdBy: 1 });
smsCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SMSCampaign', smsCampaignSchema);

