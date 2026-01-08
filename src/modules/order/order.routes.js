const router = require('express').Router();
const controller = require('./order.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { 
  createOrderValidation, 
  deleteOrderItemValidation, 
  updateOrderItemQuantityValidation,
  orderIdValidation,
  cancelOrderValidation,
  reorderValidation,
  updateOrderNotesValidation,
  saveOrderItemValidation,
  unsaveOrderItemValidation
} = require('./order.validation');

// Get all orders
router.get('/orders', auth, controller.getOrders);

// Get orders summary/stats (must be before /orders/:id to avoid route conflict)
router.get('/orders/summary', auth, controller.getOrdersSummary);

// Get single order by ID
router.get('/orders/:id', auth, controller.getOrderById);

// Create order (unified - handles cart, prescription, and custom items)
router.post('/orders', auth, createOrderValidation, validate, controller.createOrder);

// Delete order item (only for pending orders)
router.delete('/orders/:orderId/items/:itemId', auth, deleteOrderItemValidation, validate, controller.deleteOrderItem);

// Update order item quantity (only for pending orders)
router.put('/orders/:orderId/items/:itemId/quantity', auth, updateOrderItemQuantityValidation, validate, controller.updateOrderItemQuantity);

// Save order item (mark as saved for later - only for pending orders)
router.post('/orders/:orderId/items/:itemId/save', auth, saveOrderItemValidation, validate, controller.saveOrderItem);

// Unsave order item (move back to active - only for pending orders)
router.delete('/orders/:orderId/items/:itemId/save', auth, unsaveOrderItemValidation, validate, controller.unsaveOrderItem);

// Get order status
router.get('/orders/:id/status', auth, orderIdValidation, validate, controller.getOrderStatus);

// Get order tracking
router.get('/orders/:id/tracking', auth, orderIdValidation, validate, controller.getOrderTracking);

// Get order invoice
router.get('/orders/:id/invoice', auth, orderIdValidation, validate, controller.getOrderInvoice);

// Cancel order
router.put('/orders/:id/cancel', auth, cancelOrderValidation, validate, controller.cancelOrder);

// Reorder (create new order from existing order)
router.post('/orders/:id/reorder', auth, reorderValidation, validate, controller.reorder);

// Update order notes
router.put('/orders/:id/notes', auth, updateOrderNotesValidation, validate, controller.updateOrderNotes);

module.exports = router;

