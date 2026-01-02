const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['order', 'prescription', 'payment', 'appointment', 'chat', 'system'],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed, // Additional data like orderId, prescriptionId, etc.
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    actionUrl: String
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

