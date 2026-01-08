const HelpDeskQuery = require('../../models/HelpDeskQuery.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Create help desk query (Public - no auth required)
exports.createHelpDeskQuery = async (data, req = null) => {
  // Extract IP and user agent if available
  const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
  const userAgent = req ? req.headers['user-agent'] : null;
  
  const helpDeskQuery = await HelpDeskQuery.create({
    firstName: data.firstName,
    email: data.email.toLowerCase(),
    message: data.message || '',
    source: data.source || 'website',
    ipAddress,
    userAgent,
    status: 'pending',
    priority: data.priority || 'medium'
  });
  
  logger.info('Help desk query created', {
    queryId: helpDeskQuery._id,
    email: helpDeskQuery.email
  });
  
  return helpDeskQuery;
};

// Get all help desk queries (Admin/Sub-Admin only)
exports.getAllHelpDeskQueries = async (query = {}) => {
  const filter = {};
  
  // Status filter
  if (query.status) {
    filter.status = query.status;
  }
  
  // Priority filter
  if (query.priority) {
    filter.priority = query.priority;
  }
  
  // Email search
  if (query.email) {
    filter.email = { $regex: query.email, $options: 'i' };
  }
  
  // First name search
  if (query.firstName) {
    filter.firstName = { $regex: query.firstName, $options: 'i' };
  }
  
  // Date range filter
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }
  
  // Source filter
  if (query.source) {
    filter.source = query.source;
  }
  
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  
  const queries = await HelpDeskQuery.find(filter)
    .populate({
      path: 'respondedBy',
      select: 'firstName lastName email'
    })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await HelpDeskQuery.countDocuments(filter);
  
  return {
    queries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get help desk query by ID
exports.getHelpDeskQueryById = async (queryId) => {
  const query = await HelpDeskQuery.findById(queryId)
    .populate({
      path: 'respondedBy',
      select: 'firstName lastName email'
    })
    .lean();
  
  if (!query) {
    throw new AppError('Help desk query not found', 404);
  }
  
  return query;
};

// Update help desk query (Admin/Sub-Admin only)
exports.updateHelpDeskQuery = async (queryId, data, userId = null) => {
  const query = await HelpDeskQuery.findById(queryId);
  
  if (!query) {
    throw new AppError('Help desk query not found', 404);
  }
  
  // Update fields
  if (data.firstName !== undefined) query.firstName = data.firstName;
  if (data.email !== undefined) query.email = data.email.toLowerCase();
  if (data.message !== undefined) query.message = data.message;
  if (data.status !== undefined) query.status = data.status;
  if (data.priority !== undefined) query.priority = data.priority;
  if (data.response !== undefined) query.response = data.response;
  if (data.tags !== undefined) query.tags = data.tags;
  if (data.source !== undefined) query.source = data.source;
  
  // If response is provided and status is being updated to resolved/closed
  if (data.response && (data.status === 'resolved' || data.status === 'closed')) {
    query.respondedBy = userId;
    query.respondedAt = new Date();
  }
  
  await query.save();
  
  // Populate and return
  return await HelpDeskQuery.findById(query._id)
    .populate({
      path: 'respondedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Delete help desk query (Admin/Sub-Admin only)
exports.deleteHelpDeskQuery = async (queryId) => {
  const query = await HelpDeskQuery.findByIdAndDelete(queryId);
  
  if (!query) {
    throw new AppError('Help desk query not found', 404);
  }
  
  logger.info('Help desk query deleted', {
    queryId: query._id,
    email: query.email
  });
  
  return { message: 'Help desk query deleted successfully' };
};

// Get help desk statistics (Admin/Sub-Admin only)
exports.getHelpDeskStatistics = async () => {
  const total = await HelpDeskQuery.countDocuments();
  const pending = await HelpDeskQuery.countDocuments({ status: 'pending' });
  const inProgress = await HelpDeskQuery.countDocuments({ status: 'in_progress' });
  const resolved = await HelpDeskQuery.countDocuments({ status: 'resolved' });
  const closed = await HelpDeskQuery.countDocuments({ status: 'closed' });
  
  const urgent = await HelpDeskQuery.countDocuments({ priority: 'urgent', status: { $ne: 'closed' } });
  const high = await HelpDeskQuery.countDocuments({ priority: 'high', status: { $ne: 'closed' } });
  
  // Get queries by source
  const bySource = await HelpDeskQuery.aggregate([
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get queries by status
  const byStatus = await HelpDeskQuery.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    total,
    byStatus: {
      pending,
      inProgress,
      resolved,
      closed
    },
    byPriority: {
      urgent,
      high
    },
    bySource: bySource.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    statusBreakdown: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

