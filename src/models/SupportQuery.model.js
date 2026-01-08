const mongoose = require('mongoose');

const supportQuerySchema = new mongoose.Schema(
  {
    queryNumber: {
      type: String,
      unique: true,
      required: false // Generated in pre-save hook
      // Note: unique: true already creates an index, so no need for explicit index
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['general', 'order', 'payment', 'refund', 'technical', 'medication', 'prescription', 'other'],
      default: 'general'
    },
    // Firebase chat reference
    firebaseChatId: {
      type: String,
      trim: true
    },
    // Assigned support agent/admin
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Last message info
    lastMessage: {
      text: String,
      sender: {
        type: String,
        enum: ['patient', 'support']
      },
      timestamp: Date
    },
    // Message count
    messageCount: {
      type: Number,
      default: 0
    },
    // Read status
    isReadByPatient: {
      type: Boolean,
      default: true
    },
    isReadBySupport: {
      type: Boolean,
      default: false
    },
    // Tags for categorization
    tags: [{
      type: String,
      trim: true
    }],
    // Resolution info
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: String,
    // Closed info
    closedAt: Date,
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Generate unique query number
supportQuerySchema.pre('save', async function (next) {
  if (!this.queryNumber) {
    let isUnique = false;
    let newQueryNumber;
    while (!isUnique) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      newQueryNumber = `Q-${year}-${randomNum}`;
      const existingQuery = await mongoose.model('SupportQuery').findOne({ queryNumber: newQueryNumber });
      if (!existingQuery) {
        isUnique = true;
      }
    }
    this.queryNumber = newQueryNumber;
  }
  next();
});

// Indexes for efficient queries
supportQuerySchema.index({ patient: 1, createdAt: -1 });
supportQuerySchema.index({ status: 1, createdAt: -1 });
supportQuerySchema.index({ priority: 1, status: 1 });
supportQuerySchema.index({ assignedTo: 1, status: 1 });
// queryNumber already has unique: true which creates an index, so no need for explicit index
supportQuerySchema.index({ firebaseChatId: 1 });
supportQuerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportQuery', supportQuerySchema);

