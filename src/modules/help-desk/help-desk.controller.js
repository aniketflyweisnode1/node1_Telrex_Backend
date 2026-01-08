const helpDeskService = require('./help-desk.service');

// Create help desk query (Public)
exports.createHelpDeskQuery = async (req, res, next) => {
  try {
    const query = await helpDeskService.createHelpDeskQuery(req.body, req);
    res.status(201).json({
      success: true,
      message: 'Help desk query submitted successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Get all help desk queries (Admin/Sub-Admin only)
exports.getAllHelpDeskQueries = async (req, res, next) => {
  try {
    const result = await helpDeskService.getAllHelpDeskQueries(req.query);
    res.status(200).json({
      success: true,
      message: 'Help desk queries retrieved successfully',
      data: result.queries,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get help desk query by ID (Admin/Sub-Admin only)
exports.getHelpDeskQueryById = async (req, res, next) => {
  try {
    const query = await helpDeskService.getHelpDeskQueryById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Help desk query retrieved successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Update help desk query (Admin/Sub-Admin only)
exports.updateHelpDeskQuery = async (req, res, next) => {
  try {
    const query = await helpDeskService.updateHelpDeskQuery(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: 'Help desk query updated successfully',
      data: query
    });
  } catch (err) {
    next(err);
  }
};

// Delete help desk query (Admin/Sub-Admin only)
exports.deleteHelpDeskQuery = async (req, res, next) => {
  try {
    const result = await helpDeskService.deleteHelpDeskQuery(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Get help desk statistics (Admin/Sub-Admin only)
exports.getHelpDeskStatistics = async (req, res, next) => {
  try {
    const statistics = await helpDeskService.getHelpDeskStatistics();
    res.status(200).json({
      success: true,
      message: 'Help desk statistics retrieved successfully',
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

