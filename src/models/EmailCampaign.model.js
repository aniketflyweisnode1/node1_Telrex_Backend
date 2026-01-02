const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema(
  {
    // Campaign Images
    images: [{
      fileName: {
        type: String,
        required: true
      },
      fileUrl: {
        type: String,
        required: true
      },
      fileType: {
        type: String
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Email Content
    subject: {
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
emailCampaignSchema.index({ status: 1 });
emailCampaignSchema.index({ scheduledAt: 1 });
emailCampaignSchema.index({ createdBy: 1 });
emailCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);

