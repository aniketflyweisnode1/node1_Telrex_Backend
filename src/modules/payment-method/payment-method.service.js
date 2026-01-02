const PaymentMethod = require('../../models/PaymentMethod.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get all payment methods
exports.getPaymentMethods = async (userId) => {
  const patient = await getPatient(userId);
  
  const paymentMethods = await PaymentMethod.find({
    patient: patient._id,
    isActive: true
  })
    .select('-securityCode -gatewayToken') // Never return sensitive data
    .sort({ isDefault: -1, createdAt: -1 });
  
  return paymentMethods;
};

// Get single payment method
exports.getPaymentMethodById = async (userId, paymentMethodId) => {
  const patient = await getPatient(userId);
  
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    patient: patient._id,
    isActive: true
  }).select('-securityCode -gatewayToken');
  
  if (!paymentMethod) throw new AppError('Payment method not found', 404);
  
  return paymentMethod;
};

// Add new payment method
exports.addPaymentMethod = async (userId, data) => {
  const patient = await getPatient(userId);
  
  // Validate card number and extract last 4 digits
  if (data.type === 'card') {
    if (!data.cardNumber) throw new AppError('Card number is required', 400);
    
    // Remove spaces and get last 4 digits
    const cleanCardNumber = data.cardNumber.replace(/\s/g, '');
    data.cardLast4 = cleanCardNumber.slice(-4);
    
    // Detect card brand
    if (cleanCardNumber.startsWith('4')) {
      data.cardBrand = 'visa';
    } else if (cleanCardNumber.startsWith('5') || cleanCardNumber.startsWith('2')) {
      data.cardBrand = 'mastercard';
    } else if (cleanCardNumber.startsWith('3')) {
      data.cardBrand = 'amex';
    } else if (cleanCardNumber.startsWith('6')) {
      data.cardBrand = 'discover';
    } else {
      data.cardBrand = 'other';
    }
    
    // Store only last 4 digits, mask the rest
    data.cardNumber = `****${data.cardLast4}`;
  }
  
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await PaymentMethod.updateMany(
      { patient: patient._id },
      { $set: { isDefault: false } }
    );
  }
  
  const paymentMethod = await PaymentMethod.create({
    patient: patient._id,
    ...data
  });
  
  return await PaymentMethod.findById(paymentMethod._id)
    .select('-securityCode -gatewayToken');
};

// Update payment method
exports.updatePaymentMethod = async (userId, paymentMethodId, data) => {
  const patient = await getPatient(userId);
  
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    patient: patient._id
  });
  
  if (!paymentMethod) throw new AppError('Payment method not found', 404);
  
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await PaymentMethod.updateMany(
      { patient: patient._id, _id: { $ne: paymentMethodId } },
      { $set: { isDefault: false } }
    );
  }
  
  // Update fields
  Object.assign(paymentMethod, data);
  await paymentMethod.save();
  
  return await PaymentMethod.findById(paymentMethod._id)
    .select('-securityCode -gatewayToken');
};

// Remove payment method (soft delete)
exports.removePaymentMethod = async (userId, paymentMethodId) => {
  const patient = await getPatient(userId);
  
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    patient: patient._id
  });
  
  if (!paymentMethod) throw new AppError('Payment method not found', 404);
  
  // Soft delete
  paymentMethod.isActive = false;
  await paymentMethod.save();
  
  // If this was the default, set another as default
  if (paymentMethod.isDefault) {
    const newDefault = await PaymentMethod.findOne({
      patient: patient._id,
      _id: { $ne: paymentMethodId },
      isActive: true
    });
    
    if (newDefault) {
      newDefault.isDefault = true;
      await newDefault.save();
    }
  }
  
  return { message: 'Payment method removed successfully' };
};

// Set default payment method
exports.setDefaultPaymentMethod = async (userId, paymentMethodId) => {
  const patient = await getPatient(userId);
  
  // Check if payment method exists and belongs to patient
  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodId,
    patient: patient._id,
    isActive: true
  });
  
  if (!paymentMethod) throw new AppError('Payment method not found', 404);
  
  // Unset all defaults for this patient
  await PaymentMethod.updateMany(
    { patient: patient._id, _id: { $ne: paymentMethodId } },
    { $set: { isDefault: false } }
  );
  
  // Set this payment method as default using findOneAndUpdate to ensure atomic operation
  const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
    paymentMethodId,
    { $set: { isDefault: true } },
    { new: true, runValidators: true }
  ).select('-securityCode -gatewayToken');
  
  if (!updatedPaymentMethod) throw new AppError('Failed to update payment method', 500);
  
  return updatedPaymentMethod;
};

