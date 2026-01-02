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

// Process checkout (create order and payment)
exports.processCheckout = async (req, res, next) => {
  try {
    // Validate checkout data
    const validationResult = await checkoutService.validateCheckout(req.user.id, req.body);
    
    // Create order from cart
    const order = await orderService.createOrderFromCart(req.user.id, {
      shippingAddressId: req.body.shippingAddressId,
      shippingCharges: req.body.shippingCharges,
      billingAddress: validationResult.billingAddress,
      billingAddressSameAsShipping: validationResult.billingAddressSameAsShipping,
      orderComment: req.body.orderComment,
      notes: req.body.orderComment || req.body.notes
    });
    
    // Create payment
    const payment = await paymentService.createPayment(req.user.id, {
      orderId: order._id,
      paymentMethod: req.body.paymentMethod,
      paymentGateway: req.body.paymentGateway,
      cardDetails: req.body.cardDetails
    });
    
    res.status(201).json({
      success: true,
      message: 'Order placed and payment processed successfully',
      data: {
        order,
        payment
      }
    });
  } catch (err) { next(err); }
};

