const SupportQuery = require('../../models/SupportQuery.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Safely import Firebase - handle if not available
let firebaseDatabase = null;
try {
  const firebaseConfig = require('../../config/firebase');
  firebaseDatabase = firebaseConfig.firebaseDatabase;
} catch (error) {
  logger.warn('Firebase not available, support system will use MongoDB only', {
    error: error.message
  });
}

// Helper function to get patient
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    throw new AppError('Patient profile not found', 404);
  }
  return patient;
};

// Create support query and Firebase chat
exports.createSupportQuery = async (userId, data) => {
  const patient = await getPatient(userId);
  
  // Create support query in MongoDB
  const supportQuery = await SupportQuery.create({
    patient: patient._id,
    subject: data.subject || 'General Inquiry',
    message: data.message,
    status: 'open',
    priority: data.priority || 'medium',
    category: data.category || 'general',
    tags: data.tags || [],
    messageCount: 1,
    lastMessage: {
      text: data.message,
      sender: 'patient',
      timestamp: new Date()
    }
  });
  
  // Create Firebase chat if Firebase is available
  if (firebaseDatabase) {
    try {
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery._id}`);
      const initialMessage = {
        text: data.message,
        sender: 'patient',
        senderId: userId,
        senderName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      await chatRef.set({
        queryId: supportQuery._id.toString(),
        queryNumber: supportQuery.queryNumber,
        patientId: patient._id.toString(),
        patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
        status: 'open',
        createdAt: new Date().toISOString(),
        messages: {
          [Date.now()]: initialMessage
        }
      });
      
      // Update support query with Firebase chat ID
      supportQuery.firebaseChatId = supportQuery._id.toString();
      await supportQuery.save();
      
      logger.info('Firebase chat created for support query', {
        queryId: supportQuery._id,
        firebaseChatId: supportQuery.firebaseChatId
      });
    } catch (error) {
      logger.error('Failed to create Firebase chat', {
        queryId: supportQuery._id,
        error: error.message
      });
      // Continue without Firebase - MongoDB will store the query
    }
  }
  
  return await SupportQuery.findById(supportQuery._id)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .lean();
};

// Get all support queries for patient
exports.getSupportQueries = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter = { patient: patient._id };
  
  if (query.status) {
    filter.status = query.status;
  }
  
  if (query.category) {
    filter.category = query.category;
  }
  
  if (query.priority) {
    filter.priority = query.priority;
  }
  
  // Get queries
  const supportQueries = await SupportQuery.find(filter)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Get total count
  const total = await SupportQuery.countDocuments(filter);
  
  return {
    queries: supportQueries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get support query by ID
exports.getSupportQueryById = async (userId, queryId) => {
  const patient = await getPatient(userId);
  
  const supportQuery = await SupportQuery.findOne({
    _id: queryId,
    patient: patient._id
  })
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .populate('resolvedBy', 'firstName lastName email')
    .populate('closedBy', 'firstName lastName email')
    .lean();
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  // Get messages from Firebase if available
  let messages = [];
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}/messages`);
      const snapshot = await chatRef.once('value');
      const firebaseMessages = snapshot.val();
      
      if (firebaseMessages) {
        messages = Object.keys(firebaseMessages)
          .map(key => ({
            id: key,
            ...firebaseMessages[key]
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
    } catch (error) {
      logger.error('Failed to fetch Firebase messages', {
        queryId: supportQuery._id,
        error: error.message
      });
    }
  }
  
  return {
    ...supportQuery,
    messages
  };
};

// Send message to support query (Firebase)
exports.sendMessage = async (userId, queryId, messageData) => {
  const patient = await getPatient(userId);
  
  const supportQuery = await SupportQuery.findOne({
    _id: queryId,
    patient: patient._id
  });
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  if (supportQuery.status === 'closed') {
    throw new AppError('Cannot send message to closed query', 400);
  }
  
  // Update MongoDB support query first
  supportQuery.messageCount += 1;
  supportQuery.lastMessage = {
    text: messageData.message,
    sender: 'patient',
    timestamp: new Date()
  };
  supportQuery.isReadBySupport = false;
  supportQuery.isReadByPatient = true;
  
  if (supportQuery.status === 'resolved') {
    supportQuery.status = 'open'; // Reopen if resolved
  }
  
  await supportQuery.save();
  
  // Create Firebase message if Firebase is available
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const messagesRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}/messages`);
      const newMessageRef = messagesRef.push();
      
      const message = {
        text: messageData.message,
        sender: 'patient',
        senderId: userId,
        senderName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      await newMessageRef.set(message);
      
      // Update chat metadata
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}`);
      await chatRef.update({
        lastMessage: message,
        updatedAt: new Date().toISOString()
      });
      
      logger.info('Message sent to Firebase chat', {
        queryId: supportQuery._id,
        messageId: newMessageRef.key
      });
      
      return {
        messageId: newMessageRef.key,
        ...message
      };
    } catch (error) {
      logger.error('Failed to send Firebase message, but message saved in MongoDB', {
        queryId: supportQuery._id,
        error: error.message
      });
      // Return success even if Firebase fails - message is saved in MongoDB
      return {
        messageId: `mongo_${Date.now()}`,
        text: messageData.message,
        sender: 'patient',
        senderId: userId,
        senderName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
        timestamp: new Date().toISOString(),
        read: false
      };
    }
  } else {
    // Firebase not available - return success with MongoDB-only message
    logger.warn('Firebase not available, message saved in MongoDB only', {
      queryId: supportQuery._id
    });
    return {
      messageId: `mongo_${Date.now()}`,
      text: messageData.message,
      sender: 'patient',
      senderId: userId,
      senderName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
      timestamp: new Date().toISOString(),
      read: false
    };
  }
};

// Mark messages as read
exports.markAsRead = async (userId, queryId) => {
  const patient = await getPatient(userId);
  
  const supportQuery = await SupportQuery.findOne({
    _id: queryId,
    patient: patient._id
  });
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  supportQuery.isReadByPatient = true;
  await supportQuery.save();
  
  // Mark Firebase messages as read
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const messagesRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}/messages`);
      const snapshot = await messagesRef.once('value');
      const messages = snapshot.val();
      
      if (messages) {
        const updates = {};
        Object.keys(messages).forEach(key => {
          if (messages[key].sender === 'support' && !messages[key].read) {
            updates[`${key}/read`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await messagesRef.update(updates);
        }
      }
    } catch (error) {
      logger.error('Failed to mark Firebase messages as read', {
        queryId: supportQuery._id,
        error: error.message
      });
    }
  }
  
  return { message: 'Messages marked as read' };
};

// Close support query
exports.closeSupportQuery = async (userId, queryId) => {
  const patient = await getPatient(userId);
  
  const supportQuery = await SupportQuery.findOne({
    _id: queryId,
    patient: patient._id
  });
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  if (supportQuery.status === 'closed') {
    throw new AppError('Query is already closed', 400);
  }
  
  supportQuery.status = 'closed';
  supportQuery.closedAt = new Date();
  supportQuery.closedBy = userId;
  await supportQuery.save();
  
  // Update Firebase chat status
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}`);
      await chatRef.update({
        status: 'closed',
        closedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update Firebase chat status', {
        queryId: supportQuery._id,
        error: error.message
      });
    }
  }
  
  return await SupportQuery.findById(supportQuery._id)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('closedBy', 'firstName lastName email')
    .lean();
};

// ==================== ADMIN/SUPPORT PANEL FUNCTIONS ====================

// Get all support queries (Admin/Support)
exports.getAllSupportQueriesAdmin = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter = {};
  
  if (query.status) {
    filter.status = query.status;
  }
  
  if (query.category) {
    filter.category = query.category;
  }
  
  if (query.priority) {
    filter.priority = query.priority;
  }
  
  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }
  
  if (query.patientId) {
    filter.patient = query.patientId;
  }
  
  // Search by query number or subject
  if (query.search) {
    filter.$or = [
      { queryNumber: { $regex: query.search, $options: 'i' } },
      { subject: { $regex: query.search, $options: 'i' } },
      { message: { $regex: query.search, $options: 'i' } }
    ];
  }
  
  // Date range filtering
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }
  
  // Get queries
  const supportQueries = await SupportQuery.find(filter)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Get total count
  const total = await SupportQuery.countDocuments(filter);
  
  return {
    queries: supportQueries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get support query by ID (Admin/Support)
exports.getSupportQueryByIdAdmin = async (queryId) => {
  const supportQuery = await SupportQuery.findById(queryId)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .populate('resolvedBy', 'firstName lastName email')
    .populate('closedBy', 'firstName lastName email')
    .lean();
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  // Get messages from Firebase if available
  let messages = [];
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}/messages`);
      const snapshot = await chatRef.once('value');
      const firebaseMessages = snapshot.val();
      
      if (firebaseMessages) {
        messages = Object.keys(firebaseMessages)
          .map(key => ({
            id: key,
            ...firebaseMessages[key]
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      }
    } catch (error) {
      logger.error('Failed to fetch Firebase messages', {
        queryId: supportQuery._id,
        error: error.message
      });
    }
  }
  
  return {
    ...supportQuery,
    messages
  };
};

// Reply to support query (Admin/Support)
exports.replyToSupportQuery = async (adminId, queryId, messageData) => {
  const User = require('../../models/User.model');
  
  const admin = await User.findById(adminId);
  if (!admin) {
    throw new AppError('Admin user not found', 404);
  }
  
  const supportQuery = await SupportQuery.findById(queryId);
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  if (supportQuery.status === 'closed') {
    throw new AppError('Cannot send message to closed query', 400);
  }
  
  // Update MongoDB support query
  supportQuery.messageCount += 1;
  supportQuery.lastMessage = {
    text: messageData.message,
    sender: 'support',
    timestamp: new Date()
  };
  supportQuery.isReadBySupport = true;
  supportQuery.isReadByPatient = false;
  
  // Update status if needed
  if (supportQuery.status === 'open') {
    supportQuery.status = 'in_progress';
  }
  
  await supportQuery.save();
  
  // Create Firebase message if Firebase is available
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const messagesRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}/messages`);
      const newMessageRef = messagesRef.push();
      
      const message = {
        text: messageData.message,
        sender: 'support',
        senderId: adminId,
        senderName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Support Team',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      await newMessageRef.set(message);
      
      // Update chat metadata
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}`);
      await chatRef.update({
        lastMessage: message,
        updatedAt: new Date().toISOString(),
        status: supportQuery.status
      });
      
      logger.info('Support reply sent to Firebase chat', {
        queryId: supportQuery._id,
        messageId: newMessageRef.key,
        adminId: adminId
      });
      
      return {
        messageId: newMessageRef.key,
        ...message
      };
    } catch (error) {
      logger.error('Failed to send Firebase message, but message saved in MongoDB', {
        queryId: supportQuery._id,
        error: error.message
      });
      // Return success even if Firebase fails - message is saved in MongoDB
      return {
        messageId: `mongo_${Date.now()}`,
        text: messageData.message,
        sender: 'support',
        senderId: adminId,
        senderName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Support Team',
        timestamp: new Date().toISOString(),
        read: false
      };
    }
  } else {
    // Firebase not available - return success with MongoDB-only message
    logger.warn('Firebase not available, support reply saved in MongoDB only', {
      queryId: supportQuery._id
    });
    return {
      messageId: `mongo_${Date.now()}`,
      text: messageData.message,
      sender: 'support',
      senderId: adminId,
      senderName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Support Team',
      timestamp: new Date().toISOString(),
      read: false
    };
  }
};

// Assign support query to admin/agent
exports.assignSupportQuery = async (adminId, queryId, assignedToId) => {
  const supportQuery = await SupportQuery.findById(queryId);
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  // Verify assigned user exists and is admin/sub-admin
  const User = require('../../models/User.model');
  const assignedUser = await User.findById(assignedToId);
  
  if (!assignedUser) {
    throw new AppError('Assigned user not found', 404);
  }
  
  if (assignedUser.role !== 'admin' && assignedUser.role !== 'doctor') {
    throw new AppError('Can only assign to admin or sub-admin', 400);
  }
  
  supportQuery.assignedTo = assignedToId;
  if (supportQuery.status === 'open') {
    supportQuery.status = 'in_progress';
  }
  await supportQuery.save();
  
  // Update Firebase chat if available
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}`);
      await chatRef.update({
        assignedTo: assignedToId,
        assignedToName: `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || 'Support Agent',
        status: supportQuery.status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update Firebase chat assignment', {
        queryId: supportQuery._id,
        error: error.message
      });
    }
  }
  
  return await SupportQuery.findById(supportQuery._id)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .lean();
};

// Update support query status (Admin/Support)
exports.updateSupportQueryStatus = async (adminId, queryId, status, data = {}) => {
  const supportQuery = await SupportQuery.findById(queryId);
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }
  
  const oldStatus = supportQuery.status;
  supportQuery.status = status;
  
  // Update status-specific fields
  if (status === 'resolved' && oldStatus !== 'resolved') {
    supportQuery.resolvedAt = new Date();
    supportQuery.resolvedBy = adminId;
    if (data.resolutionNotes) {
      supportQuery.resolutionNotes = data.resolutionNotes;
    }
  } else if (status === 'closed' && oldStatus !== 'closed') {
    supportQuery.closedAt = new Date();
    supportQuery.closedBy = adminId;
  }
  
  await supportQuery.save();
  
  // Update Firebase chat status
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const chatRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}`);
      const updateData = {
        status: status,
        updatedAt: new Date().toISOString()
      };
      
      if (status === 'resolved') {
        updateData.resolvedAt = new Date().toISOString();
        updateData.resolvedBy = adminId;
      }
      if (status === 'closed') {
        updateData.closedAt = new Date().toISOString();
        updateData.closedBy = adminId;
      }
      
      await chatRef.update(updateData);
    } catch (error) {
      logger.error('Failed to update Firebase chat status', {
        queryId: supportQuery._id,
        error: error.message
      });
    }
  }
  
  return await SupportQuery.findById(supportQuery._id)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .populate('resolvedBy', 'firstName lastName email')
    .populate('closedBy', 'firstName lastName email')
    .lean();
};

// Mark messages as read (Admin/Support)
exports.markAsReadAdmin = async (adminId, queryId) => {
  const supportQuery = await SupportQuery.findOne({ _id: queryId });
  
  if (!supportQuery) {
    throw new AppError('Support query not found', 404);
  }
  
  supportQuery.isReadBySupport = true;
  await supportQuery.save();
  
  // Mark Firebase messages as read
  if (firebaseDatabase && supportQuery.firebaseChatId) {
    try {
      const messagesRef = firebaseDatabase.ref(`support-chats/${supportQuery.firebaseChatId}/messages`);
      const snapshot = await messagesRef.once('value');
      const messages = snapshot.val();
      
      if (messages) {
        const updates = {};
        Object.keys(messages).forEach(key => {
          if (messages[key].sender === 'patient' && !messages[key].read) {
            updates[`${key}/read`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await messagesRef.update(updates);
        }
      }
    } catch (error) {
      logger.error('Failed to mark Firebase messages as read', {
        queryId: supportQuery._id,
        error: error.message
      });
    }
  }
  
  return { message: 'Messages marked as read' };
};

// Get support system statistics (Admin/Support)
exports.getSupportStatistics = async () => {
  const total = await SupportQuery.countDocuments();
  const open = await SupportQuery.countDocuments({ status: 'open' });
  const inProgress = await SupportQuery.countDocuments({ status: 'in_progress' });
  const resolved = await SupportQuery.countDocuments({ status: 'resolved' });
  const closed = await SupportQuery.countDocuments({ status: 'closed' });
  
  const byPriority = {
    low: await SupportQuery.countDocuments({ priority: 'low' }),
    medium: await SupportQuery.countDocuments({ priority: 'medium' }),
    high: await SupportQuery.countDocuments({ priority: 'high' }),
    urgent: await SupportQuery.countDocuments({ priority: 'urgent' })
  };
  
  const byCategory = {
    general: await SupportQuery.countDocuments({ category: 'general' }),
    order: await SupportQuery.countDocuments({ category: 'order' }),
    payment: await SupportQuery.countDocuments({ category: 'payment' }),
    refund: await SupportQuery.countDocuments({ category: 'refund' }),
    technical: await SupportQuery.countDocuments({ category: 'technical' }),
    medication: await SupportQuery.countDocuments({ category: 'medication' }),
    prescription: await SupportQuery.countDocuments({ category: 'prescription' }),
    other: await SupportQuery.countDocuments({ category: 'other' })
  };
  
  const unreadBySupport = await SupportQuery.countDocuments({ isReadBySupport: false });
  const unreadByPatient = await SupportQuery.countDocuments({ isReadByPatient: false });
  
  // Get recent queries (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = await SupportQuery.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });
  
  return {
    total,
    byStatus: {
      open,
      in_progress: inProgress,
      resolved,
      closed
    },
    byPriority,
    byCategory,
    unread: {
      bySupport: unreadBySupport,
      byPatient: unreadByPatient
    },
    recent
  };
};

// Get assigned support queries for logged-in admin/agent
exports.getAssignedSupportQueries = async (adminId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter - only queries assigned to this admin
  const filter = {
    assignedTo: adminId
  };
  
  // Additional filters
  if (query.status) {
    filter.status = query.status;
  }
  
  if (query.category) {
    filter.category = query.category;
  }
  
  if (query.priority) {
    filter.priority = query.priority;
  }
  
  // Search by query number or subject
  if (query.search) {
    filter.$or = [
      { queryNumber: { $regex: query.search, $options: 'i' } },
      { subject: { $regex: query.search, $options: 'i' } },
      { message: { $regex: query.search, $options: 'i' } }
    ];
  }
  
  // Date range filtering
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }
  
  // Get queries assigned to this admin
  const supportQueries = await SupportQuery.find(filter)
    .populate('patient', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Get total count
  const total = await SupportQuery.countDocuments(filter);
  
  // Get unread count for this admin
  const unreadCount = await SupportQuery.countDocuments({
    assignedTo: adminId,
    isReadBySupport: false
  });
  
  return {
    queries: supportQueries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

