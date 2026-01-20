const mongoose = require('mongoose');

const securityMetricSchema = new mongoose.Schema(
  {
    metricType: {
      type: String,
      required: true,
      enum: ['failed_login_attempts', 'active_sessions', 'data_export_requests', 'security_alerts'],
      index: true
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    period: {
      type: String,
      enum: ['24h', '7d', '30d', 'all'],
      default: '24h'
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    details: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      ipAddress: String,
      userAgent: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: mongoose.Schema.Types.Mixed
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
securityMetricSchema.index({ metricType: 1, date: -1 });
securityMetricSchema.index({ period: 1, date: -1 });
securityMetricSchema.index({ isActive: 1 });

module.exports = mongoose.model('SecurityMetric', securityMetricSchema);

