const paymentMethodService = require('./payment-method.service');

// Get all payment methods
exports.getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await paymentMethodService.getPaymentMethods(req.user.id);
    res.status(200).json({ success: true, data: paymentMethods });
  } catch (err) { next(err); }
};

// Get single payment method
exports.getPaymentMethodById = async (req, res, next) => {
  try {
    const paymentMethod = await paymentMethodService.getPaymentMethodById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: paymentMethod });
  } catch (err) { next(err); }
};

// Add new payment method
exports.addPaymentMethod = async (req, res, next) => {
  try {
    const paymentMethod = await paymentMethodService.addPaymentMethod(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Payment method added successfully', data: paymentMethod });
  } catch (err) { next(err); }
};

// Update payment method
exports.updatePaymentMethod = async (req, res, next) => {
  try {
    const paymentMethod = await paymentMethodService.updatePaymentMethod(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Payment method updated successfully', data: paymentMethod });
  } catch (err) { next(err); }
};

// Remove payment method
exports.removePaymentMethod = async (req, res, next) => {
  try {
    const result = await paymentMethodService.removePaymentMethod(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

// Set default payment method
exports.setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const paymentMethod = await paymentMethodService.setDefaultPaymentMethod(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Default payment method updated', data: paymentMethod });
  } catch (err) { next(err); }
};

