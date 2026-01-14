const healthHistoryService = require('./health-history.service');

// Get all health histories for a patient
exports.getHealthHistories = async (req, res, next) => {
  try {
    const result = await healthHistoryService.getHealthHistories(
      req.params.id,
      req.query
    );

    res.status(200).json({
      success: true,
      message: 'Health histories retrieved successfully',
      data: result.healthHistories,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get health history by ID
exports.getHealthHistoryById = async (req, res, next) => {
  try {
    const healthHistory = await healthHistoryService.getHealthHistoryById(
      req.params.id,
      req.params.healthHistoryId
    );

    res.status(200).json({
      success: true,
      message: 'Health history retrieved successfully',
      data: healthHistory
    });
  } catch (err) {
    next(err);
  }
};

// Create health history
exports.createHealthHistory = async (req, res, next) => {
  try {
    const healthHistory = await healthHistoryService.createHealthHistory(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Health history created successfully',
      data: healthHistory
    });
  } catch (err) {
    next(err);
  }
};

// Update health history
exports.updateHealthHistory = async (req, res, next) => {
  try {
    const healthHistory = await healthHistoryService.updateHealthHistory(
      req.params.id,
      req.params.healthHistoryId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Health history updated successfully',
      data: healthHistory
    });
  } catch (err) {
    next(err);
  }
};

// Delete health history
exports.deleteHealthHistory = async (req, res, next) => {
  try {
    const result = await healthHistoryService.deleteHealthHistory(
      req.params.id,
      req.params.healthHistoryId
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

