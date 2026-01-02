const router = require('express').Router();
const controller = require('./order.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createOrderValidation, updateItemQuantityValidation } = require('./order.validation');

// Get all orders
router.get('/orders', auth, controller.getOrders);

// Get single order by ID
router.get('/orders/:id', auth, controller.getOrderById);

// Create order (legacy - from prescription)
router.post('/orders', auth, createOrderValidation, validate, controller.createOrder);

// Delete order item (only for pending orders)
router.delete('/orders/:orderId/items/:itemId', auth, controller.deleteOrderItem);

// Save order item for later
router.post('/orders/:orderId/items/:itemId/save', auth, controller.saveOrderItem);

// Update order item quantity (only for pending orders)
router.put('/orders/:orderId/items/:itemId/quantity', auth, updateItemQuantityValidation, validate, controller.updateOrderItemQuantity);

// Reorder (create new order from existing order)
router.post('/orders/:orderId/reorder', auth, controller.reorder);

// Get order status
router.get('/orders/:id/status', auth, controller.getOrderStatus);

// Get order tracking information
router.get('/orders/:id/tracking', auth, controller.getOrderTracking);

module.exports = router;

