const supportSystemService = require('./support-system.service');

// Create support query
exports.createSupportQuery = async (req, res, next) => {
  try {
    const query = await supportSystemService.createSupportQuery(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Support query created successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Get all support queries
exports.getSupportQueries = async (req, res, next) => {
  try {
    const result = await supportSystemService.getSupportQueries(req.user.id, req.query);
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

// Get support query by ID
exports.getSupportQueryById = async (req, res, next) => {
  try {
    const query = await supportSystemService.getSupportQueryById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Support query retrieved successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Send message to support query
exports.sendMessage = async (req, res, next) => {
  try {
    const message = await supportSystemService.sendMessage(req.user.id, req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (err) {
    next(err);
  }
};

// Mark messages as read
exports.markAsRead = async (req, res, next) => {
  try {
    const result = await supportSystemService.markAsRead(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Close support query
exports.closeSupportQuery = async (req, res, next) => {
  try {
    const query = await supportSystemService.closeSupportQuery(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Support query closed successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Clear chat (Patient)
exports.clearChat = async (req, res, next) => {
  try {
    const result = await supportSystemService.clearChatPatient(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Edit message (Patient)
exports.editMessage = async (req, res, next) => {
  try {
    const message = await supportSystemService.editMessagePatient(
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

