const refillService = require('./refill.service');

// Create refill
exports.createRefill = async (req, res, next) => {
  try {
    const refill = await refillService.createRefill(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Refill created successfully',
      data: refill
    });
  } catch (err) {
    next(err);
  }
};

// Get all refills
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

// Update refill
exports.updateRefill = async (req, res, next) => {
  try {
    const refill = await refillService.updateRefill(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Refill updated successfully',
      data: refill
    });
  } catch (err) {
    next(err);
  }
};

// Delete refill
exports.deleteRefill = async (req, res, next) => {
  try {
    const result = await refillService.deleteRefill(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
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

// Skip refill (skip this month)
exports.skipRefill = async (req, res, next) => {
  try {
    const refill = await refillService.skipRefill(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Refill skipped successfully',
      data: refill
    });
  } catch (err) {
    next(err);
  }
};

// Create order from approved refills (checkout) - supports multiple selected refills
exports.createOrderFromRefill = async (req, res, next) => {
  try {
    const order = await refillService.createOrderFromRefill(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Order created from refills successfully',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// Get all refill orders (orders created from refills)
exports.getRefillOrders = async (req, res, next) => {
  try {
    const result = await refillService.getRefillOrders(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Refill orders retrieved successfully',
      data: result.orders,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get refill order by ID
exports.getRefillOrderById = async (req, res, next) => {
  try {
    const order = await refillService.getRefillOrderById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Refill order retrieved successfully',
      data: order
    });
  } catch (err) {
    next(err);
  }
};
