const orderService = require('./order.service');

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders(req.user.id, req.query);
    res.status(200).json({ success: true, data: orders });
  } catch (err) { next(err); }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (err) { next(err); }
};

exports.deleteOrderItem = async (req, res, next) => {
  try {
    const order = await orderService.deleteOrderItem(req.user.id, req.params.orderId, req.params.itemId);
    res.status(200).json({ success: true, message: 'Item removed from order', data: order });
  } catch (err) { next(err); }
};

exports.saveOrderItem = async (req, res, next) => {
  try {
    const order = await orderService.saveOrderItem(req.user.id, req.params.orderId, req.params.itemId);
    res.status(200).json({ success: true, message: 'Item saved for later', data: order });
  } catch (err) { next(err); }
};

exports.updateOrderItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const order = await orderService.updateOrderItemQuantity(req.user.id, req.params.orderId, req.params.itemId, quantity);
    res.status(200).json({ success: true, message: 'Quantity updated', data: order });
  } catch (err) { next(err); }
};

exports.reorder = async (req, res, next) => {
  try {
    const order = await orderService.reorder(req.user.id, req.params.orderId);
    res.status(201).json({ success: true, message: 'Order recreated successfully', data: order });
  } catch (err) { next(err); }
};

exports.getOrderStatus = async (req, res, next) => {
  try {
    const status = await orderService.getOrderStatus(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: status });
  } catch (err) { next(err); }
};

exports.getOrderTracking = async (req, res, next) => {
  try {
    const tracking = await orderService.getOrderTracking(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: tracking });
  } catch (err) { next(err); }
};

