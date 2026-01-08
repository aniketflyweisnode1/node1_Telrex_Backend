const Cart = require('../../models/Cart.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get or create cart
const getOrCreateCart = async (patientId) => {
  let cart = await Cart.findOne({ patient: patientId });
  if (!cart) {
    cart = await Cart.create({ patient: patientId });
  }
  return cart;
};

// Get cart
exports.getCart = async (userId) => {
  const patient = await getPatient(userId);
  const cart = await getOrCreateCart(patient._id);
  return cart;
};

// Add item to cart
exports.addToCart = async (userId, data) => {
  const patient = await getPatient(userId);
  const cart = await getOrCreateCart(patient._id);

  const { productId, productName, productImage, productType, quantity, unitPrice } = data;
  
  // Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    item => item.productId === productId && item.productType === productType
  );

  if (existingItemIndex !== -1) {
    // Update quantity
    cart.items[existingItemIndex].quantity += quantity || 1;
    cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].unitPrice;
  } else {
    // Add new item
    const totalPrice = (quantity || 1) * unitPrice;
    cart.items.push({
      productId,
      productName,
      productImage,
      productType: productType || 'medication',
      quantity: quantity || 1,
      unitPrice,
      totalPrice
    });
  }

  await cart.save();
  return cart;
};

// Remove item from cart
exports.removeFromCart = async (userId, itemId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  cart.items = cart.items.filter(item => item._id.toString() !== itemId);
  
  // If cart becomes empty, clear coupon and discount
  if (cart.items.length === 0) {
    cart.couponCode = undefined;
    cart.discount = 0;
  }
  
  await cart.save();
  
  return cart;
};

// Remove all items from cart
exports.clearCart = async (userId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  cart.items = [];
  cart.couponCode = undefined;
  cart.discount = 0;
  cart.subtotal = 0;
  cart.tax = 0;
  cart.shippingCharges = 0;
  cart.totalAmount = 0;
  
  await cart.save();
  
  return cart;
};

// Update item quantity
exports.updateItemQuantity = async (userId, itemId, quantity) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);
  
  if (quantity <= 0) {
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    // If cart becomes empty, clear coupon and discount
    if (cart.items.length === 0) {
      cart.couponCode = undefined;
      cart.discount = 0;
    }
  } else {
    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
  }
  
  await cart.save();
  return cart;
};

// Save item for later
exports.saveForLater = async (userId, itemId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);
  
  item.isSaved = true;
  await cart.save();
  
  return cart;
};

// Unsave item (move back to active cart)
exports.unsaveItem = async (userId, itemId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);
  
  if (!item.isSaved) {
    throw new AppError('Item is not saved for later', 400);
  }
  
  item.isSaved = false;
  await cart.save();
  
  return cart;
};

// Apply coupon
exports.applyCoupon = async (userId, couponCode) => {
  const patient = await getPatient(userId);
  const cart = await getOrCreateCart(patient._id);
  
  const Coupon = require('../../models/Coupon.model');
  const coupon = await Coupon.findOne({ 
    code: couponCode.toUpperCase(),
    isActive: true
  });
  
  if (!coupon) {
    throw new AppError('Invalid or expired coupon code', 400);
  }
  
  // Check validity dates
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new AppError('Coupon has expired', 400);
  }
  
  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached', 400);
  }
  
  // Check minimum purchase amount
  if (cart.subtotal < coupon.minPurchaseAmount) {
    throw new AppError(`Minimum purchase amount of ${coupon.minPurchaseAmount} required`, 400);
  }
  
  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (cart.subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = coupon.discountValue;
  }
  
  cart.couponCode = coupon.code;
  cart.discount = discount;
  await cart.save();
  
  return {
    cart,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: discount
    }
  };
};

// Remove coupon
exports.removeCoupon = async (userId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  cart.couponCode = undefined;
  cart.discount = 0;
  await cart.save();
  
  return cart;
};

