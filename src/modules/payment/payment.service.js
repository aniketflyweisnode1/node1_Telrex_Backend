const Payment = require('../../models/Payment.model');
const Order = require('../../models/Order.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');
const stripeService = require('../../services/stripe.service');
const logger = require('../../utils/logger');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get order invoice
exports.getInvoice = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  })
    .populate('shippingAddress')
    .populate('payment')
    .lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Determine billing address for invoice
  // Use the order's billingAddress if it exists, otherwise derive from shipping address
  let invoiceBillingAddress = null;
  
  if (order.billingAddress && Object.keys(order.billingAddress).length > 0) {
    // Use the order's stored billing address
    invoiceBillingAddress = order.billingAddress;
  } else if (order.billingAddressSameAsShipping !== false && order.shippingAddress) {
    // Fallback: Convert shipping address to billing address format if billingAddress not stored
    invoiceBillingAddress = {
      firstName: order.shippingAddress.fullName?.split(' ')[0] || '',
      lastName: order.shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
      email: '',
      phoneNumber: order.shippingAddress.phoneNumber || '',
      streetAddress: order.shippingAddress.addressLine1 || '',
      city: order.shippingAddress.city || '',
      state: order.shippingAddress.state || '',
      zipCode: order.shippingAddress.postalCode || ''
    };
  }
  
  return {
    invoiceNumber: `INV-${order.orderNumber}`,
    order: {
      ...order,
      // Ensure order.billingAddress is properly set
      billingAddress: order.billingAddress || invoiceBillingAddress
    },
    billingAddress: invoiceBillingAddress,
    items: order.items,
    subtotal: order.subtotal,
    shippingCharges: order.shippingCharges,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt
  };
};

// Create payment intent (Stripe)
exports.createPaymentIntent = async (userId, data) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: data.orderId,
    patient: patient._id
  });
  
  if (!order) {
    logger.warn('Payment intent creation failed - Order not found', { userId, orderId: data.orderId });
    throw new AppError('Order not found', 404);
  }
  if (order.paymentStatus === 'paid') {
    logger.warn('Payment intent creation failed - Order already paid', { userId, orderId: data.orderId });
    throw new AppError('Order already paid', 400);
  }
  
  // Check if payment already exists
  let payment = await Payment.findOne({
    order: order._id,
    patient: patient._id,
    paymentStatus: { $in: ['pending', 'processing'] }
  });
  
  if (!payment) {
    // Generate payment ID before creation
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const paymentId = `PAY-${timestamp}-${String(random).padStart(4, '0')}`;
    
    // Create payment record
    payment = await Payment.create({
      paymentId: paymentId,
      order: order._id,
      patient: patient._id,
      amount: order.totalAmount,
      currency: data.currency?.toUpperCase() || 'INR',
      paymentMethod: data.paymentMethod || 'card',
      paymentStatus: 'pending',
      paymentGateway: 'stripe'
    });
    
    logger.info('Payment record created', {
      paymentId: payment.paymentId,
      orderId: order._id,
      amount: order.totalAmount,
      userId
    });
  }
  
  // Create Stripe payment intent
  const stripeResult = await stripeService.createPaymentIntent(
    order.totalAmount,
    data.currency || 'inr',
    {
      orderId: order._id.toString(),
      paymentId: payment._id.toString(),
      patientId: patient._id.toString(),
      orderNumber: order.orderNumber
    }
  );
  
  // Update payment with Stripe details
  payment.stripePaymentIntentId = stripeResult.paymentIntentId;
  payment.stripeClientSecret = stripeResult.clientSecret;
  payment.paymentStatus = 'processing';
  payment.gatewayResponse = {
    paymentIntentId: stripeResult.paymentIntentId,
    status: stripeResult.status
  };
  await payment.save();
  
  // Link payment to order
  if (!order.payment) {
    order.payment = payment._id;
    await order.save();
  }
  
  logger.info('Payment intent created successfully', {
    paymentId: payment.paymentId,
    stripePaymentIntentId: stripeResult.paymentIntentId,
    orderId: order._id,
    amount: order.totalAmount,
    userId
  });
  
  return {
    payment,
    clientSecret: stripeResult.clientSecret,
    paymentIntentId: stripeResult.paymentIntentId
  };
};

// Verify payment (after client-side confirmation)
exports.verifyPayment = async (userId, paymentIntentId) => {
  const patient = await getPatient(userId);
  
  // Retrieve payment intent from Stripe
  const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
  
  // Find payment record
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntentId,
    patient: patient._id
  }).populate('order');
  
  if (!payment) throw new AppError('Payment not found', 404);
  
  // Update payment based on Stripe status
  if (paymentIntent.status === 'succeeded') {
    payment.paymentStatus = 'success';
    payment.isVerified = true;
    payment.verifiedAt = new Date();
    payment.transactionId = paymentIntent.latest_charge || paymentIntent.id;
    payment.stripeChargeId = paymentIntent.latest_charge;
    payment.paidAt = new Date(paymentIntent.created * 1000);
    payment.gatewayResponse = paymentIntent;
    
    // Update order
    if (payment.order) {
      payment.order.paymentStatus = 'paid';
      payment.order.status = 'confirmed';
      await payment.order.save();
    }
  } else if (paymentIntent.status === 'processing') {
    payment.paymentStatus = 'processing';
    payment.gatewayResponse = paymentIntent;
  } else if (paymentIntent.status === 'requires_payment_method' || 
             paymentIntent.status === 'canceled') {
    payment.paymentStatus = 'failed';
    payment.failedAt = new Date();
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    payment.gatewayResponse = paymentIntent;
    
    // Update order
    if (payment.order) {
      payment.order.paymentStatus = 'failed';
      await payment.order.save();
    }
  }
  
  await payment.save();
  
  return payment;
};

// Create payment (deprecated - use createPaymentIntent instead)
exports.createPayment = async (userId, data) => {
  // All payments must go through Stripe payment intent
  throw new AppError('Please use /payments/intent endpoint for Stripe payments', 400);
};

// Get payment history
exports.getPaymentHistory = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const filter = { patient: patient._id };
  if (query.status) filter.paymentStatus = query.status;
  
  const payments = await Payment.find(filter)
    .populate('order')
    .sort({ createdAt: -1 });
  
  return payments;
};

// Refund payment
exports.refundPayment = async (userId, paymentId, data) => {
  const patient = await getPatient(userId);
  
  const payment = await Payment.findOne({
    _id: paymentId,
    patient: patient._id
  });
  
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.paymentStatus !== 'success') {
    throw new AppError('Only successful payments can be refunded', 400);
  }
  
  const refundAmount = data.amount || payment.amount;
  
  // Process refund through Stripe if payment was made via Stripe
  if (payment.paymentGateway === 'stripe' && payment.stripeChargeId) {
    try {
      const refund = await stripeService.createRefund(
        payment.stripeChargeId,
        refundAmount,
        data.reason || 'requested_by_customer'
      );
      
      payment.paymentStatus = 'refunded';
      payment.refundAmount = refundAmount / 100; // Convert from smallest unit
      payment.refundReason = data.reason || 'Customer request';
      payment.refundedAt = new Date();
      payment.stripeRefundId = refund.id;
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        refund: refund
      };
    } catch (error) {
      throw new AppError(`Refund failed: ${error.message}`, 400);
    }
  } else {
    // For non-Stripe payments
    payment.paymentStatus = 'refunded';
    payment.refundAmount = refundAmount;
    payment.refundReason = data.reason || 'Customer request';
    payment.refundedAt = new Date();
  }
  
  await payment.save();
  
  // Update order
  const order = await Order.findById(payment.order);
  if (order) {
    order.paymentStatus = 'refunded';
    await order.save();
  }
  
  return payment;
};

// Handle Stripe webhook
exports.handleStripeWebhook = async (event) => {
  const paymentIntent = event.data.object;
  
  logger.info('Stripe webhook received', {
    eventType: event.type,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status
  });
  
  // Find payment by Stripe payment intent ID
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id
  }).populate('order');
  
  if (!payment) {
    logger.warn('Payment not found for Stripe webhook', {
      paymentIntentId: paymentIntent.id,
      eventType: event.type
    });
    return null;
  }
  
  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      payment.paymentStatus = 'success';
      payment.isVerified = true;
      payment.verifiedAt = new Date();
      payment.transactionId = paymentIntent.latest_charge || paymentIntent.id;
      payment.stripeChargeId = paymentIntent.latest_charge;
      payment.paidAt = new Date(paymentIntent.created * 1000);
      payment.gatewayResponse = paymentIntent;
      
      // Update order
      if (payment.order) {
        payment.order.paymentStatus = 'paid';
        payment.order.status = 'confirmed';
        await payment.order.save();
      }
      
      logger.info('Payment succeeded via webhook', {
        paymentId: payment.paymentId,
        paymentIntentId: paymentIntent.id,
        orderId: payment.order?._id,
        amount: payment.amount
      });
      break;
      
    case 'payment_intent.payment_failed':
      payment.paymentStatus = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      payment.gatewayResponse = paymentIntent;
      
      // Update order
      if (payment.order) {
        payment.order.paymentStatus = 'failed';
        await payment.order.save();
      }
      
      logger.error('Payment failed via webhook', {
        paymentId: payment.paymentId,
        paymentIntentId: paymentIntent.id,
        orderId: payment.order?._id,
        failureReason: payment.failureReason
      });
      break;
      
    case 'payment_intent.processing':
      payment.paymentStatus = 'processing';
      payment.gatewayResponse = paymentIntent;
      break;
      
    case 'charge.refunded':
      payment.paymentStatus = 'refunded';
      payment.refundAmount = paymentIntent.amount_refunded / 100; // Convert from smallest unit
      payment.refundedAt = new Date();
      payment.stripeRefundId = paymentIntent.refunds?.data[0]?.id;
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        refund: paymentIntent.refunds
      };
      
      // Update order
      if (payment.order) {
        payment.order.paymentStatus = 'refunded';
        await payment.order.save();
      }
      break;
  }
  
  await payment.save();
  return payment;
};

