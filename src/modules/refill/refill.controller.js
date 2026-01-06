const refillService = require('./refill.service');

// Get all refills for patient
exports.getRefills = async (req, res, next) => {
  try {
    const result = await refillService.getRefills(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Refills retrieved successfully',
      data: result.refills,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get refill by ID
exports.getRefillById = async (req, res, next) => {
  try {
    const refill = await refillService.getRefillById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Refill retrieved successfully',
      data: refill
    });
  } catch (err) {
    next(err);
  }
};

// Request refill (refill now)
exports.requestRefill = async (req, res, next) => {
  try {
    const refill = await refillService.requestRefill(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Refill request submitted successfully',
      data: refill
    });
  } catch (err) {
    next(err);
  }
};

// Cancel refill
exports.cancelRefill = async (req, res, next) => {
  try {
    const refill = await refillService.cancelRefill(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Refill cancelled successfully',
      data: refill
    });
  } catch (err) {
    next(err);
  }
};

