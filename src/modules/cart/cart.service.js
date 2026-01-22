/**
 * Cart Service
 * Refactored to use shared helpers
 */

const Cart = require('../../models/Cart.model');
const Medicine = require('../../models/Medicine.model');
const SavedMedicine = require('../../models/SavedMedicine.model');
const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');
const { getPatient, batchPopulateProducts } = require('../../helpers');

/**
 * Get or create cart for patient
 */
const getOrCreateCart = async (patientId) => {
  let cart = await Cart.findOne({ patient: patientId });
  if (!cart) {
    cart = await Cart.create({ patient: patientId });
  }
  return cart;
};

/**
 * Get cart with product details and patient info
 */
exports.getCart = async (userId) => {
  const patient = await getPatient(userId, { lean: false, populate: true });
  
  // Get cart with patient populated
  let cart = await Cart.findOne({ patient: patient._id })
    .populate({
      path: 'patient',
      select: 'user dateOfBirth gender bloodGroup profilePicture',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    })
    .lean();
  
  if (!cart) {
    const newCart = await Cart.create({ patient: patient._id });
    // Populate the new cart
    cart = await Cart.findById(newCart._id)
      .populate({
        path: 'patient',
        select: 'user dateOfBirth gender bloodGroup profilePicture',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber countryCode profilePicture'
        }
      })
      .lean();
    return cart;
  }
  
  if (!cart.items || cart.items.length === 0) {
    return cart;
  }
  
  // Batch populate product details
  cart.items = await batchPopulateProducts(cart.items);
  
  return cart;
};

/**
 * Get saved items (saved for later)
 */
exports.getSavedItems = async (userId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id }).lean();
  
  if (!cart || !cart.items) {
    return { items: [], totalSaved: 0, count: 0 };
  }
  
  // Filter only saved items
  const savedItems = cart.items.filter(item => item.isSaved === true);
  
  if (savedItems.length === 0) {
    return { items: [], totalSaved: 0, count: 0 };
  }
  
  // Batch populate product details
  const itemsWithDetails = await batchPopulateProducts(savedItems);
  const totalSaved = itemsWithDetails.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  
  return { 
    items: itemsWithDetails, 
    totalSaved, 
    count: itemsWithDetails.length 
  };
};

/**
 * Add item to cart
 */
exports.addToCart = async (userId, data) => {
  const patient = await getPatient(userId, { lean: false });
  const cart = await getOrCreateCart(patient._id);

  const { productId, productName, productImage, productType, quantity, unitPrice } = data;
  
  // Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    item => item.productId === productId && item.productType === productType
  );

  if (existingItemIndex !== -1) {
    // Update quantity
    cart.items[existingItemIndex].quantity += quantity || 1;
    cart.items[existingItemIndex].totalPrice = 
      cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].unitPrice;
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

/**
 * Remove item from cart
 */
exports.removeFromCart = async (userId, itemId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  cart.items = cart.items.filter(item => item._id.toString() !== itemId);
  
  // Clear coupon if cart becomes empty
  if (cart.items.length === 0) {
    cart.couponCode = undefined;
    cart.discount = 0;
  }
  
  await cart.save();
  return cart;
};

/**
 * Clear all items from cart
 */
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

/**
 * Update item quantity
 */
exports.updateItemQuantity = async (userId, itemId, quantity) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);
  
  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i._id.toString() !== itemId);
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

/**
 * Save item for later
 */
exports.saveForLater = async (userId, itemId) => {
  const patient = await getPatient(userId, { lean: false });
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);
  if (item.isSaved) throw new AppError('Item is already saved for later', 400);
  
  item.isSaved = true;
  
  // Also save to SavedMedicine collection if it's a medicine
  if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
    try {
      const medicine = await Medicine.findOne({
        _id: item.productId,
        isActive: true,
        visibility: true
      });
      
      if (medicine) {
        const existingSaved = await SavedMedicine.findOne({
          patient: patient._id,
          medicine: item.productId
        });
        
        if (!existingSaved) {
          await SavedMedicine.create({
            patient: patient._id,
            medicine: item.productId
          });
        }
      }
    } catch (error) {
      console.error('Error saving medicine to SavedMedicine:', error.message);
    }
  }
  
  await cart.save();
  return cart;
};

/**
 * Unsave item (move back to active cart)
 */
exports.unsaveItem = async (userId, itemId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Item not found in cart', 404);
  if (!item.isSaved) throw new AppError('Item is not saved for later', 400);
  
  item.isSaved = false;
  
  await cart.save();
  return cart;
};

/**
 * Apply coupon to cart
 */
exports.applyCoupon = async (userId, couponCode) => {
  const patient = await getPatient(userId, { lean: false });
  const cart = await getOrCreateCart(patient._id);
  
  const Coupon = require('../../models/Coupon.model');
  const coupon = await Coupon.findOne({ 
    code: couponCode.toUpperCase(),
    isActive: true
  });
  
  if (!coupon) throw new AppError('Invalid or expired coupon code', 400);
  
  // Validate coupon
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new AppError('Coupon has expired', 400);
  }
  
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached', 400);
  }
  
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
      discount
    }
  };
};

/**
 * Remove coupon from cart
 */
exports.removeCoupon = async (userId) => {
  const patient = await getPatient(userId);
  const cart = await Cart.findOne({ patient: patient._id });
  
  if (!cart) throw new AppError('Cart not found', 404);
  
  cart.couponCode = undefined;
  cart.discount = 0;
  await cart.save();
  
  return cart;
};
