const router = require('express').Router();
const controller = require('./payment-method.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  addPaymentMethodValidation,
  updatePaymentMethodValidation
} = require('./payment-method.validation');

// Get all payment methods
router.get('/payment-options', controller.getPaymentMethods);

// Get single payment method
router.get('/payment-options/:id', controller.getPaymentMethodById);

// Add new payment method
router.post('/payment-options', auth, addPaymentMethodValidation, validate, controller.addPaymentMethod);

// Update payment method
router.put('/payment-options/:id', auth, updatePaymentMethodValidation, validate, controller.updatePaymentMethod);

// Remove payment method
router.delete('/payment-options/:id', auth, controller.removePaymentMethod);

// Set default payment method
router.put('/payment-options/:id/default', auth, controller.setDefaultPaymentMethod);

module.exports = router;

