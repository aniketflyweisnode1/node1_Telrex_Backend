const Cart = require('../../models/Cart.model');
const Patient = require('../../models/Patient.model');
const Address = require('../../models/Address.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get checkout summary (cart + billing info)
exports.getCheckoutSummary = async (userId) => {
  const patient = await getPatient(userId);
  const User = require('../../models/User.model');
  const Cart = require('../../models/Cart.model');
  
  // Get user details
  const user = await User.findById(patient.user).select('firstName lastName email phoneNumber');
  
  const cart = await Cart.findOne({ patient: patient._id });
  if (!cart || cart.items.filter(item => !item.isSaved).length === 0) {
    throw new AppError('Cart is empty', 400);
  }
  
  // Get default address or all addresses
  const addresses = await Address.find({ patient: patient._id })
    .sort({ isDefault: -1 });
  
  // Calculate tax if not set
  const tax = cart.tax || (cart.subtotal * 0.03);
  const shippingCharges = cart.shippingCharges || 10.00;
  const totalAmount = cart.subtotal + shippingCharges + tax - cart.discount;
  
  const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
  
  return {
    user: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || ''
    },
    cart: {
      items: cart.items.filter(item => !item.isSaved),
      subtotal: cart.subtotal,
      discount: cart.discount,
      tax: tax,
      shippingCharges: shippingCharges,
      totalAmount: totalAmount,
      couponCode: cart.couponCode
    },
    addresses,
    defaultAddress: defaultAddress ? {
      _id: defaultAddress._id,
      type: defaultAddress.type,
      fullName: defaultAddress.fullName,
      phoneNumber: defaultAddress.phoneNumber,
      countryCode: defaultAddress.countryCode,
      addressLine1: defaultAddress.addressLine1,
      addressLine2: defaultAddress.addressLine2,
      city: defaultAddress.city,
      state: defaultAddress.state,
      postalCode: defaultAddress.postalCode,
      country: defaultAddress.country
    } : null
  };
};

// Validate checkout data
exports.validateCheckout = async (userId, data) => {
  const patient = await getPatient(userId);
  const Cart = require('../../models/Cart.model');
  
  const cart = await Cart.findOne({ patient: patient._id });
  if (!cart || cart.items.filter(item => !item.isSaved).length === 0) {
    throw new AppError('Cart is empty', 400);
  }
  
  // Verify shipping address
  const shippingAddress = await Address.findOne({
    _id: data.shippingAddressId,
    patient: patient._id
  });
  if (!shippingAddress) throw new AppError('Shipping address not found', 404);
  
  // Validate billing address
  const billingAddressSameAsShipping = data.billingAddressSameAsShipping !== false;
  let billingAddress = null;
  
  if (billingAddressSameAsShipping) {
    // Use shipping address as billing address
    billingAddress = {
      firstName: shippingAddress.fullName?.split(' ')[0] || '',
      lastName: shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
      email: '',
      phoneNumber: shippingAddress.phoneNumber || '',
      streetAddress: shippingAddress.addressLine1 || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      zipCode: shippingAddress.postalCode || ''
    };
  } else {
    // Validate billing address fields
    if (!data.billingAddress) {
      throw new AppError('Billing address is required when different from shipping', 400);
    }
    
    const requiredFields = ['firstName', 'lastName', 'streetAddress', 'city', 'state', 'zipCode', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !data.billingAddress[field]);
    
    if (missingFields.length > 0) {
      throw new AppError(`Missing billing address fields: ${missingFields.join(', ')}`, 400);
    }
    
    billingAddress = {
      firstName: data.billingAddress.firstName,
      lastName: data.billingAddress.lastName,
      email: data.billingAddress.email || '',
      phoneNumber: data.billingAddress.phoneNumber,
      streetAddress: data.billingAddress.streetAddress,
      city: data.billingAddress.city,
      state: data.billingAddress.state,
      zipCode: data.billingAddress.zipCode
    };
  }
  
  // Validate payment method
  const validPaymentMethods = ['card', 'upi', 'netbanking', 'wallet', 'cod'];
  if (!validPaymentMethods.includes(data.paymentMethod)) {
    throw new AppError('Invalid payment method', 400);
  }
  
  // If card payment, validate card details
  if (data.paymentMethod === 'card') {
    if (!data.cardDetails || !data.cardDetails.cardNumber || !data.cardDetails.expiryDate || !data.cardDetails.cvv) {
      throw new AppError('Card details are required for card payment', 400);
    }
  }
  
  return {
    cart,
    shippingAddress,
    billingAddress,
    billingAddressSameAsShipping
  };
};

