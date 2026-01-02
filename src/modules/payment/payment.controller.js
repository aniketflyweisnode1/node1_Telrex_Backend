const paymentService = require('./payment.service');
const logger = require('../../utils/logger');

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await paymentService.getInvoice(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// Legacy endpoint removed - use /payments/intent instead

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await paymentService.getPaymentHistory(req.user.id, req.query);
    res.status(200).json({ success: true, data: payments });
  } catch (err) { next(err); }
};

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const result = await paymentService.createPaymentIntent(req.user.id, req.body);
    res.status(201).json({ 
      success: true, 
      message: 'Payment intent created successfully', 
      data: result 
    });
  } catch (err) { next(err); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'Payment intent ID is required' });
    }
    
    const payment = await paymentService.verifyPayment(req.user.id, paymentIntentId);
    res.status(200).json({ 
      success: true, 
      message: 'Payment verified successfully', 
      data: payment 
    });
  } catch (err) { next(err); }
};

exports.refundPayment = async (req, res, next) => {
  try {
    // Get payment ID from body or params
    const paymentId = req.body.paymentId || req.params.id;
    const payment = await paymentService.refundPayment(req.user.id, paymentId, req.body);
    res.status(200).json({ success: true, message: 'Refund processed successfully', data: payment });
  } catch (err) { next(err); }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const stripeService = require('../../services/stripe.service');
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      logger.warn('Stripe webhook received without signature');
      return res.status(400).json({ success: false, message: 'Missing stripe-signature header' });
    }
    
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle webhook event
    const payment = await paymentService.handleStripeWebhook(event);
    
    // Return 200 to acknowledge receipt
    res.status(200).json({ received: true, paymentId: payment?._id });
  } catch (err) {
    logger.error('Webhook processing error', {
      error: err.message,
      stack: err.stack
    });
    res.status(400).json({ success: false, message: err.message });
  }
};

