const express = require('express');
const router = express.Router();
const refillController = require('./refill.controller');
const refillValidation = require('./refill.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC GET ROUTES ====================
// Get all refills - PUBLIC
router.get(
  '/refills',
  refillValidation.getRefillsValidation,
  validate,
  refillController.getRefills
);

// Create order from approved refills (checkout) - supports multiple selected refills (must come before /refills/:id)
router.post(
  '/refills/checkout',
  refillValidation.createOrderFromRefillValidation,
  validate,
  refillController.createOrderFromRefill
);

// Get all refill orders (orders created from refills) - must come before /refills/:id - PUBLIC
router.get(
  '/refills/orders',
  refillValidation.getRefillOrdersValidation,
  validate,
  refillController.getRefillOrders
);

// Get refill order by ID - must come before /refills/:id - PUBLIC
router.get(
  '/refills/orders/:id',
  refillValidation.refillOrderIdValidation,
  validate,
  refillController.getRefillOrderById
);

// Cancel refill (must come before /refills/:id to avoid route conflict)
router.put(
  '/refills/:id/cancel',
  refillValidation.refillIdValidation,
  validate,
  refillController.cancelRefill
);

// Skip refill (skip this month) (must come before /refills/:id to avoid route conflict)
router.put(
  '/refills/:id/skip',
  refillValidation.skipRefillValidation,
  validate,
  refillController.skipRefill
);

// Get refill by ID (must come last to avoid route conflicts) - PUBLIC
router.get(
  '/refills/:id',
  refillValidation.refillIdValidation,
  validate,
  refillController.getRefillById
);

// ==================== PROTECTED ROUTES (Require Authentication) ====================
router.use(authMiddleware);

// Create refill
router.post(
  '/refills',
  refillValidation.createRefillValidation,
  validate,
  refillController.createRefill
);

// Update refill
router.put(
  '/refills/:id',
  refillValidation.updateRefillValidation,
  validate,
  refillController.updateRefill
);

// Delete refill
router.delete(
  '/refills/:id',
  refillValidation.refillIdValidation,
  validate,
  refillController.deleteRefill
);

module.exports = router;
