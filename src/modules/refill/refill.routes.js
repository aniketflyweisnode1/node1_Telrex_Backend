const express = require('express');
const router = express.Router();
const refillController = require('./refill.controller');
const refillValidation = require('./refill.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all refills for patient
router.get(
  '/',
  refillValidation.getRefillsValidation,
  validate,
  refillController.getRefills
);

// Get refill by ID
router.get(
  '/:id',
  refillValidation.refillIdValidation,
  validate,
  refillController.getRefillById
);

// Request refill (refill now)
router.post(
  '/',
  refillValidation.requestRefillValidation,
  validate,
  refillController.requestRefill
);

// Cancel refill
router.put(
  '/:id/cancel',
  refillValidation.refillIdValidation,
  validate,
  refillController.cancelRefill
);

module.exports = router;

