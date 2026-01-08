const orderService = require('./order.service');

// Get all orders
exports.getOrders = async (req, res, next) => {
  try {
    const result = await orderService.getOrders(req.user.id, req.query);
    res.status(200).json({ 
      success: true, 
      data: result.orders,
      pagination: result.pagination
    });
  } catch (err) { next(err); }
};

// Get single order by ID
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Create order (unified - handles cart, prescription, and custom items)
exports.createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (err) { next(err); }
};

// Delete order item (only for pending orders)
exports.deleteOrderItem = async (req, res, next) => {
  try {
    const order = await orderService.deleteOrderItem(req.user.id, req.params.orderId, req.params.itemId);
    res.status(200).json({ success: true, message: 'Order item deleted successfully', data: order });
  } catch (err) { next(err); }
};

// Save order item (mark as saved for later - only for pending orders)
exports.saveOrderItem = async (req, res, next) => {
  try {
    const order = await orderService.saveOrderItem(req.user.id, req.params.orderId, req.params.itemId);
    res.status(200).json({ success: true, message: 'Order item saved for later', data: order });
  } catch (err) { next(err); }
};

// Unsave order item (move back to active - only for pending orders)
exports.unsaveOrderItem = async (req, res, next) => {
  try {
    const order = await orderService.unsaveOrderItem(req.user.id, req.params.orderId, req.params.itemId);
    res.status(200).json({ success: true, message: 'Order item moved back to active', data: order });
  } catch (err) { next(err); }
};

// Update order item quantity (only for pending orders)
exports.updateOrderItemQuantity = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderItemQuantity(req.user.id, req.params.orderId, req.params.itemId, req.body.quantity);
    res.status(200).json({ success: true, message: 'Order item quantity updated successfully', data: order });
  } catch (err) { next(err); }
};

// Get order status
exports.getOrderStatus = async (req, res, next) => {
  try {
    const status = await orderService.getOrderStatus(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: status });
  } catch (err) { next(err); }
};

// Get order tracking
exports.getOrderTracking = async (req, res, next) => {
  try {
    const tracking = await orderService.getOrderTracking(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: tracking });
  } catch (err) { next(err); }
};

// Get order invoice
exports.getOrderInvoice = async (req, res, next) => {
  try {
    const invoice = await orderService.getOrderInvoice(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// Cancel order
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.user.id, req.params.id, req.body.reason);
    res.status(200).json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (err) { next(err); }
};

// Reorder
exports.reorder = async (req, res, next) => {
  try {
    const order = await orderService.reorder(req.user.id, req.params.id);
    res.status(201).json({ success: true, message: 'Order recreated successfully', data: order });
  } catch (err) { next(err); }
};

// Get orders summary
exports.getOrdersSummary = async (req, res, next) => {
  try {
    const summary = await orderService.getOrdersSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (err) { next(err); }
};

// Update order notes
exports.updateOrderNotes = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderNotes(req.user.id, req.params.id, req.body.notes);
    res.status(200).json({ success: true, message: 'Order notes updated successfully', data: order });
  } catch (err) { next(err); }
};

