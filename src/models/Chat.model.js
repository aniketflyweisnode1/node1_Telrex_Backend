const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: { type: String, required: true },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'prescription'],
      default: 'text'
    },
    attachments: [String],
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ['active', 'closed', 'archived'],
      default: 'active'
    },
    lastMessageAt: Date
  },
  { timestamps: true }
);

// Update lastMessageAt when message is added
chatSchema.pre('save', function (next) {
  if (this.messages && this.messages.length > 0) {
    const lastMessage = this.messages[this.messages.length - 1];
    this.lastMessageAt = lastMessage.createdAt || new Date();
  }
  next();
});

module.exports = mongoose.model('Chat', chatSchema);

