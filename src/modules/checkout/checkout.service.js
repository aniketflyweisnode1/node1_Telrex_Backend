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

// Get payment options for checkout
exports.getPaymentOptions = async (userId) => {
  const patient = await getPatient(userId);
  const PaymentMethod = require('../../models/PaymentMethod.model');
  
  // Get saved payment methods
  const savedPaymentMethods = await PaymentMethod.find({
    patient: patient._id,
    isActive: true
  })
    .select('-securityCode -gatewayToken')
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
  
  // Available payment methods configuration
  const availablePaymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      type: 'card',
      icon: 'card',
      description: 'Pay using credit or debit card',
      enabled: true,
      supportedCardTypes: ['visa', 'mastercard', 'amex', 'discover', 'rupay'],
      requiresDetails: true
    },
    {
      id: 'upi',
      name: 'UPI',
      type: 'upi',
      icon: 'upi',
      description: 'Pay using UPI (PhonePe, Google Pay, Paytm, etc.)',
      enabled: true,
      requiresDetails: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      type: 'netbanking',
      icon: 'netbanking',
      description: 'Pay using internet banking',
      enabled: true,
      requiresDetails: true
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      type: 'wallet',
      icon: 'wallet',
      description: 'Pay using digital wallet (Paytm, PhonePe, etc.)',
      enabled: true,
      supportedWallets: ['paytm', 'phonepe', 'googlepay', 'amazonpay'],
      requiresDetails: true
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      type: 'cod',
      icon: 'cod',
      description: 'Pay cash when your order is delivered',
      enabled: true,
      requiresDetails: false,
      maxAmount: 5000, // Maximum amount for COD (if applicable)
      available: true
    }
  ];
  
  // Format saved payment methods
  const formattedSavedMethods = savedPaymentMethods.map(method => {
    const baseMethod = {
      _id: method._id,
      type: method.type,
      isDefault: method.isDefault,
      createdAt: method.createdAt
    };
    
    if (method.type === 'card') {
      return {
        ...baseMethod,
        cardType: method.cardType,
        cardLast4: method.cardLast4,
        cardBrand: method.cardBrand,
        expiryDate: method.expiryDate,
        cardHolderName: method.cardHolderName,
        bankName: method.bankName,
        displayName: `${method.cardBrand ? method.cardBrand.toUpperCase() : 'Card'} •••• ${method.cardLast4}`
      };
    } else if (method.type === 'upi') {
      return {
        ...baseMethod,
        upiId: method.upiId,
        displayName: method.upiId
      };
    } else if (method.type === 'wallet') {
      return {
        ...baseMethod,
        walletType: method.walletType,
        walletId: method.walletId,
        displayName: `${method.walletType ? method.walletType.charAt(0).toUpperCase() + method.walletType.slice(1) : 'Wallet'} •••• ${method.walletId ? method.walletId.slice(-4) : ''}`
      };
    } else if (method.type === 'netbanking') {
      return {
        ...baseMethod,
        bankName: method.bankName,
        displayName: method.bankName || 'Net Banking'
      };
    }
    
    return baseMethod;
  });
  
  return {
    availablePaymentMethods,
    savedPaymentMethods: formattedSavedMethods,
    defaultPaymentMethod: formattedSavedMethods.find(m => m.isDefault) || null,
    paymentGateway: {
      provider: 'stripe',
      enabled: true,
      currency: 'INR'
    }
  };
};

