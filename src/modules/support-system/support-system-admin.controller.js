const supportSystemService = require('./support-system.service');

// Get all support queries (Admin/Support)
exports.getAllSupportQueries = async (req, res, next) => {
  try {
    const result = await supportSystemService.getAllSupportQueriesAdmin(req.query);
    res.status(200).json({
      success: true,
      message: 'Support queries retrieved successfully',
      data: result.queries,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get support query by ID (Admin/Support)
exports.getSupportQueryById = async (req, res, next) => {
  try {
    const query = await supportSystemService.getSupportQueryByIdAdmin(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Support query retrieved successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Reply to support query (Admin/Support)
exports.replyToSupportQuery = async (req, res, next) => {
  try {
    const message = await supportSystemService.replyToSupportQuery(req.user.id, req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: message
    });
  } catch (err) {
    next(err);
  }
};

// Assign support query (Admin/Support)
exports.assignSupportQuery = async (req, res, next) => {
  try {
    // Support both 'assignedTo' and 'assignedToId' field names
    const assignedToId = req.body.assignedTo || req.body.assignedToId;
    const query = await supportSystemService.assignSupportQuery(req.user.id, req.params.id, assignedToId);
    res.status(200).json({
      success: true,
      message: 'Support query assigned successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Update support query status (Admin/Support)
exports.updateSupportQueryStatus = async (req, res, next) => {
  try {
    const query = await supportSystemService.updateSupportQueryStatus(req.user.id, req.params.id, req.body.status, req.body);
    res.status(200).json({
      success: true,
      message: 'Support query status updated successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Mark messages as read (Admin/Support)
exports.markAsRead = async (req, res, next) => {
  try {
    const result = await supportSystemService.markAsReadAdmin(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Get support system statistics (Admin/Support)
exports.getSupportStatistics = async (req, res, next) => {
  try {
    const statistics = await supportSystemService.getSupportStatistics();
    res.status(200).json({
      success: true,
      message: 'Support statistics retrieved successfully',
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

// Get assigned support queries (for logged-in admin/agent)
exports.getAssignedSupportQueries = async (req, res, next) => {
  try {
    const result = await supportSystemService.getAssignedSupportQueries(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Assigned support queries retrieved successfully',
      data: result.queries,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (err) {
    next(err);
  }
};

// Get patient profile by query ID (Admin)
exports.getPatientProfileByQueryId = async (req, res, next) => {
  try {
    const profile = await supportSystemService.getPatientProfileByQueryId(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: profile
    });
  } catch (err) {
    next(err);
  }
};

// Clear chat (Admin)
exports.clearChat = async (req, res, next) => {
  try {
    const result = await supportSystemService.clearChatAdmin(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Edit message (Admin)
exports.editMessage = async (req, res, next) => {
  try {
    const message = await supportSystemService.editMessageAdmin(
      req.user.id,
      req.params.id,
      req.params.messageId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: message
    });
  } catch (err) {
    next(err);
  }
};

