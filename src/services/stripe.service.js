const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Create payment intent
exports.createPaymentIntent = async (amount, currency, metadata = {}) => {
  try {
    // Convert amount to smallest currency unit (paise for INR)
    const amountInSmallestUnit = Math.round(amount * 100);
    
    logger.info('Creating Stripe payment intent', {
      amount,
      amountInSmallestUnit,
      currency,
      metadata
    });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });
    
    logger.info('Stripe payment intent created', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: amountInSmallestUnit
    });
    
    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    };
  } catch (error) {
    logger.error('Stripe payment intent creation failed', {
      error: error.message,
      amount,
      currency,
      metadata
    });
    throw new AppError(`Stripe error: ${error.message}`, 400);
  }
};

// Retrieve payment intent
exports.retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw new AppError(`Stripe error: ${error.message}`, 400);
  }
};

// Confirm payment intent
exports.confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId
    });
    return paymentIntent;
  } catch (error) {
    throw new AppError(`Stripe error: ${error.message}`, 400);
  }
};

// Verify webhook signature
exports.verifyWebhookSignature = (payload, signature, secret) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret || process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    throw new AppError(`Webhook signature verification failed: ${error.message}`, 400);
  }
};

// Create refund
exports.createRefund = async (chargeId, amount, reason) => {
  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to smallest unit
      reason: reason || 'requested_by_customer'
    });
    return refund;
  } catch (error) {
    throw new AppError(`Stripe refund error: ${error.message}`, 400);
  }
};

// Get charge details
exports.retrieveCharge = async (chargeId) => {
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    return charge;
  } catch (error) {
    throw new AppError(`Stripe error: ${error.message}`, 400);
  }
};

