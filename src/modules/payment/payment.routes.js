const router = require('express').Router();
const controller = require('./payment.controller');
const auth = require('../../middlewares/auth.middleware');
const express = require('express');

// Invoice
router.get('/orders/:id/invoice', controller.getInvoice);

// Payment operations (authenticated) - Stripe only
router.post('/payments/intent', auth, controller.createPaymentIntent); // Create Stripe payment intent
router.post('/payments/verify', auth, controller.verifyPayment); // Verify payment after client confirmation
router.get('/payments/history', controller.getPaymentHistory);
router.post('/payments/refund', auth, controller.refundPayment);

// Webhook (no auth - uses signature verification)
router.post('/payments/webhook', 
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  controller.handleWebhook
);

module.exports = router;

