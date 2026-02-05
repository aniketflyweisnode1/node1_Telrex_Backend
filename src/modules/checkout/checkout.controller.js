const checkoutService = require('./checkout.service');
const orderService = require('../order/order.service');
const paymentService = require('../payment/payment.service');

// Get checkout summary
exports.getCheckoutSummary = async (req, res, next) => {
  try {
    const summary = await checkoutService.getCheckoutSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (err) { next(err); }
};

// Get payment options
exports.getPaymentOptions = async (req, res, next) => {
  try {
    const paymentOptions = await checkoutService.getPaymentOptions(req.user.id);
    res.status(200).json({ success: true, data: paymentOptions });
  } catch (err) { next(err); }
};

// Process checkout (create order and payment)
exports.processCheckout = async (req, res, next) => {
  try {
    // Validate checkout data
    const validationResult = await checkoutService.validateCheckout(req.user.id, req.body);
    
    // Create order from cart (unified order service)
    const order = await orderService.createOrder(req.user.id, {
      createFromCart: true,
      shippingAddressId: req.body.shippingAddressId,
      shippingCharges: req.body.shippingCharges,
      billingAddress: validationResult.billingAddress,
      billingAddressSameAsShipping: validationResult.billingAddressSameAsShipping,
      orderComment: req.body.orderComment,
      notes: req.body.orderComment || req.body.notes
    });

    // Create Stripe payment intent (client will confirm using clientSecret)
    const paymentIntent = await paymentService.createPaymentIntent(req.user.id, {
      orderId: order._id,
      currency: 'INR',
      paymentMethod: req.body.paymentMethod
    });
    
    res.status(201).json({
      success: true,
      message: 'Order placed and payment processed successfully',
      data: {
        order,
        payment: paymentIntent
      }
    });
  } catch (err) { next(err); }
};

