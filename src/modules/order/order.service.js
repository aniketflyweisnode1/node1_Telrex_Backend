/**
 * Order Service
 * Refactored to use shared helpers
 */

const Order = require('../../models/Order.model');
const Prescription = require('../../models/Prescription.model');
const Address = require('../../models/Address.model');
const Medicine = require('../../models/Medicine.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const { 
  getPatient, 
  batchPopulateMedicinesForOrders: batchPopulateMedicines,
  parsePagination,
  buildPaginationResponse 
} = require('../../helpers');

/**
 * Finalize order after payment success:
 * - record coupon usage (idempotent)
 * - clear active cart items (only if order was created from cart)
 */
exports.finalizePaidOrder = async (orderId) => {
  const Cart = require('../../models/Cart.model');
  const Coupon = require('../../models/Coupon.model');

  const order = await Order.findById(orderId).select('couponCode couponUsageRecorded createdFromCart patient').lean();
  if (!order) throw new AppError('Order not found', 404);

  // Record coupon usage ONCE (idempotent across webhook/verify/confirm calls)
  if (order.couponCode) {
    const flagUpdate = await Order.updateOne(
      { _id: orderId, couponUsageRecorded: false },
      { $set: { couponUsageRecorded: true } }
    );

    if (flagUpdate.modifiedCount === 1) {
      await Coupon.updateOne(
        { code: order.couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }
  }

  // Clear cart items ONLY for orders created from cart (avoid wiping unrelated cart changes)
  if (order.createdFromCart) {
    const cart = await Cart.findOne({ patient: order.patient });
    if (cart) {
      cart.items = (cart.items || []).filter(item => item.isSaved); // Keep saved items
      cart.couponCode = undefined;
      cart.discount = 0;
      cart.subtotal = 0;
      cart.tax = 0;
      cart.shippingCharges = 0;
      cart.totalAmount = 0;
      await cart.save();
    }
  }

  return { success: true };
};

// Get all orders - Using shared helpers
exports.getOrders = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  const { page, limit, skip } = parsePagination(query);
  
  // Build filter
  const filter = { patient: patient._id };
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }
  
  // Run count and find in parallel
  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .populate({
        path: 'shippingAddress',
        select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
      })
      .populate('prescription', 'medications status createdAt')
      .populate('payment', 'status amount method')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);
  
  // Batch populate medicines
  const ordersWithProducts = await batchPopulateMedicines(orders);
  
  return {
    orders: ordersWithProducts,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

// Get single order - OPTIMIZED
exports.getOrderById = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({ _id: orderId, patient: patient._id })
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .populate('payment')
    .lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Use batch helper for single order
  const [enrichedOrder] = await batchPopulateMedicines([order]);
  return enrichedOrder;
};

// Delete order item (only for pending orders) - OPTIMIZED
exports.deleteOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({ _id: orderId, patient: patient._id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'pending') throw new AppError('Can only delete items from pending orders', 400);
  
  const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) throw new AppError('Order item not found', 404);
  
  order.items.splice(itemIndex, 1);
  if (order.items.length === 0) throw new AppError('Cannot delete last item. Cancel the order instead.', 400);
  
  // Recalculate and save
  order.subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  order.tax = order.subtotal * 0.18;
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  await order.save();
  
  // Return with batch populated medicines
  const updatedOrder = await Order.findById(order._id)
    .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault' })
    .populate('prescription')
    .lean();
  
  const [enrichedOrder] = await batchPopulateMedicines([updatedOrder]);
  return enrichedOrder;
};

// Save order item - OPTIMIZED
exports.saveOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({ _id: orderId, patient: patient._id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'pending') throw new AppError('Can only save items from pending orders', 400);
  
  const item = order.items.id(itemId);
  if (!item) throw new AppError('Order item not found', 404);
  if (item.isSaved) throw new AppError('Item is already saved', 400);
  
  item.isSaved = true;
  item.status = 'saved';
  
  order.subtotal = order.items.filter(i => !i.isSaved).reduce((sum, i) => sum + i.totalPrice, 0);
  order.tax = order.subtotal * 0.18;
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  await order.save();
  
  const updatedOrder = await Order.findById(order._id)
    .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault' })
    .populate('prescription')
    .lean();
  
  const [enrichedOrder] = await batchPopulateMedicines([updatedOrder]);
  return enrichedOrder;
};

// Unsave order item - OPTIMIZED
exports.unsaveOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({ _id: orderId, patient: patient._id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'pending') throw new AppError('Can only unsave items from pending orders', 400);
  
  const item = order.items.id(itemId);
  if (!item) throw new AppError('Order item not found', 404);
  if (!item.isSaved) throw new AppError('Item is not saved', 400);
  
  item.isSaved = false;
  item.status = 'pending';
  
  order.subtotal = order.items.filter(i => !i.isSaved).reduce((sum, i) => sum + i.totalPrice, 0);
  order.tax = order.subtotal * 0.18;
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  await order.save();
  
  const updatedOrder = await Order.findById(order._id)
    .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault' })
    .populate('prescription')
    .lean();
  
  const [enrichedOrder] = await batchPopulateMedicines([updatedOrder]);
  return enrichedOrder;
};

// Update order item quantity - OPTIMIZED
exports.updateOrderItemQuantity = async (userId, orderId, itemId, quantity) => {
  if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);
  
  const patient = await getPatient(userId);
  const order = await Order.findOne({ _id: orderId, patient: patient._id });
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'pending') throw new AppError('Can only update items in pending orders', 400);
  
  const item = order.items.id(itemId);
  if (!item) throw new AppError('Order item not found', 404);
  
  item.quantity = quantity;
  item.totalPrice = item.unitPrice * quantity;
  
  order.subtotal = order.items.reduce((sum, i) => sum + i.totalPrice, 0);
  order.tax = order.subtotal * 0.18;
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  await order.save();
  
  const updatedOrder = await Order.findById(order._id)
    .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault' })
    .populate('prescription')
    .lean();
  
  const [enrichedOrder] = await batchPopulateMedicines([updatedOrder]);
  return enrichedOrder;
};

// Get order status
exports.getOrderStatus = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  })
    .select('orderNumber status paymentStatus createdAt updatedAt')
    .lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

// Get order tracking
exports.getOrderTracking = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  })
    .select('orderNumber status paymentStatus trackingNumber estimatedDelivery deliveredAt createdAt updatedAt')
    .populate({
      path: 'shippingAddress',
      select: 'fullName addressLine1 addressLine2 city state postalCode country phoneNumber'
    })
    .lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber || null,
    estimatedDelivery: order.estimatedDelivery || null,
    deliveredAt: order.deliveredAt || null,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

// Get order invoice - OPTIMIZED
exports.getOrderInvoice = async (userId, orderId) => {
  const patient = await getPatient(userId);
  const User = require('../../models/User.model');
  
  // Fetch order and user in parallel
  const [order, user] = await Promise.all([
    Order.findOne({ _id: orderId, patient: patient._id })
      .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country' })
      .populate('prescription')
      .lean(),
    User.findById(patient.user).select('firstName lastName email phoneNumber').lean()
  ]);
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Batch populate medicines
  const [enrichedOrder] = await batchPopulateMedicines([order]);
  
  return {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    customer: {
      name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'N/A',
      email: user?.email || 'N/A',
      phone: user?.phoneNumber || 'N/A'
    },
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress || order.shippingAddress,
    items: enrichedOrder.items,
    subtotal: order.subtotal,
    shippingCharges: order.shippingCharges,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    notes: order.notes || null
  };
};

// Cancel order - OPTIMIZED
exports.cancelOrder = async (userId, orderId, reason) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({ _id: orderId, patient: patient._id });
  if (!order) throw new AppError('Order not found', 404);
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
  }
  
  order.status = 'cancelled';
  if (reason) {
    order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
  }
  await order.save();
  
  logger.info('Order cancelled', { orderId: order._id, orderNumber: order.orderNumber, reason });
  
  const cancelledOrder = await Order.findById(order._id)
    .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault' })
    .populate('prescription')
    .lean();
  
  const [enrichedOrder] = await batchPopulateMedicines([cancelledOrder]);
  return enrichedOrder;
};

// Reorder - OPTIMIZED
exports.reorder = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const originalOrder = await Order.findOne({ _id: orderId, patient: patient._id })
    .populate('shippingAddress')
    .lean();
  
  if (!originalOrder) throw new AppError('Order not found', 404);
  
  const newItems = originalOrder.items.map(item => ({
    productId: item.productId,
    productType: item.productType || 'medication',
    medicationName: item.medicationName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    status: 'pending',
    brand: item.brand,
    originalPrice: item.originalPrice,
    salePrice: item.salePrice,
    images: item.images || {},
    description: item.description,
    dosage: item.dosage,
    dosageOption: item.dosageOption || null,
    quantityOption: item.quantityOption || null,
    generics: item.generics || []
  }));
  
  const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.18;
  const shippingCharges = originalOrder.shippingCharges || 10.00;
  const totalAmount = subtotal + shippingCharges + tax;
  
  const newOrder = await Order.create({
    patient: patient._id,
    prescription: originalOrder.prescription || null,
    items: newItems,
    shippingAddress: originalOrder.shippingAddress._id || originalOrder.shippingAddress,
    billingAddress: originalOrder.billingAddress || null,
    billingAddressSameAsShipping: originalOrder.billingAddressSameAsShipping !== false,
    subtotal, shippingCharges, tax, discount: 0, totalAmount,
    status: 'pending',
    notes: `Reordered from order ${originalOrder.orderNumber}`
  });
  
  logger.info('Order recreated', { originalOrderId: originalOrder._id, newOrderId: newOrder._id, orderNumber: newOrder.orderNumber });
  
  const savedOrder = await Order.findById(newOrder._id)
    .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault' })
    .populate('prescription')
    .lean();
  
  const [enrichedOrder] = await batchPopulateMedicines([savedOrder]);
  return enrichedOrder;
};

// Get orders summary/stats - OPTIMIZED with aggregation
exports.getOrdersSummary = async (userId) => {
  const patient = await getPatient(userId);
  
  // Use MongoDB aggregation for efficient counting
  const [summary] = await Order.aggregate([
    { $match: { patient: patient._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
        shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
        paymentPending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
        paymentPaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
        paymentFailed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } },
        paymentRefunded: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] } },
        totalPaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, { $ifNull: ['$totalAmount', 0] }, 0] } }
      }
    }
  ]);
  
  if (!summary) {
    return {
      total: 0,
      byStatus: { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 },
      byPaymentStatus: { pending: 0, paid: 0, failed: 0, refunded: 0 },
      totalAmount: 0,
      totalPaid: 0
    };
  }
  
  return {
    total: summary.total,
    byStatus: {
      pending: summary.pending,
      confirmed: summary.confirmed,
      processing: summary.processing,
      shipped: summary.shipped,
      delivered: summary.delivered,
      cancelled: summary.cancelled,
      returned: summary.returned
    },
    byPaymentStatus: {
      pending: summary.paymentPending,
      paid: summary.paymentPaid,
      failed: summary.paymentFailed,
      refunded: summary.paymentRefunded
    },
    totalAmount: summary.totalAmount,
    totalPaid: summary.totalPaid
  };
};

// Update order notes - OPTIMIZED
exports.updateOrderNotes = async (userId, orderId, notes) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({ _id: orderId, patient: patient._id });
  if (!order) throw new AppError('Order not found', 404);
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError(`Cannot update notes for order with status: ${order.status}`, 400);
  }
  
  order.notes = notes;
  await order.save();
  
  const updatedOrder = await Order.findById(order._id)
    .populate({ path: 'shippingAddress', select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault' })
    .populate('prescription')
    .lean();
  
  const [enrichedOrder] = await batchPopulateMedicines([updatedOrder]);
  return enrichedOrder;
};

// Create refill order (static product - RefillName)
exports.createRefillOrder = async (userId, data) => {
  const patient = await getPatient(userId);
  const Address = require('../../models/Address.model');
  
  // Static product details for RefillName
  const refillProduct = {
    productId: 'REFILL_STATIC_' + Date.now(), // Generate unique ID
    productType: 'medication',
    medicationName: 'RefillName',
    quantity: data.quantity || 1,
    unitPrice: data.unitPrice || 100, // Default price, can be overridden
    totalPrice: (data.quantity || 1) * (data.unitPrice || 100),
    status: 'pending',
    brand: 'Refill',
    originalPrice: data.unitPrice || 100,
    salePrice: data.unitPrice || 100,
    images: {},
    description: data.description || 'Refill Order',
    dosage: data.dosage || null,
    dosageOption: null,
    quantityOption: null,
    generics: []
  };
  
const items = [refillProduct];
const subtotal = refillProduct.totalPrice;

const shippingCharges = data.shippingCharges ?? 0;
const tax = data.tax ?? 0;
const discount = data.discount ?? 0;

const totalAmount = subtotal + shippingCharges + tax - discount;

  // Handle shipping address
  let address = null;
  if (data.shippingAddress && typeof data.shippingAddress === 'object') {
    const firstName = data.shippingAddress.firstName || '';
    const lastName = data.shippingAddress.lastName || '';
    const fullName = data.shippingAddress.fullName || `${firstName} ${lastName}`.trim() || 'Unknown';
    
    address = await Address.create({
      patient: patient._id,
      type: data.shippingAddress.type || 'home',
      firstName: firstName || fullName.split(' ')[0] || 'Unknown',
      lastName: lastName || fullName.split(' ').slice(1).join(' ') || '',
      email: data.shippingAddress.email || '',
      fullName: fullName,
      phoneNumber: data.shippingAddress.phoneNumber || data.shippingAddress.phone || '',
      countryCode: data.shippingAddress.countryCode || '+91',
      addressLine1: data.shippingAddress.addressLine1 || data.shippingAddress.streetAddress || data.shippingAddress.streetAddress1 || '',
      addressLine2: data.shippingAddress.addressLine2 || data.shippingAddress.streetAddress2 || '',
      city: data.shippingAddress.city || '',
      state: data.shippingAddress.state || data.shippingAddress.stateProvince || '',
      postalCode: data.shippingAddress.postalCode || data.shippingAddress.zipCode || '',
      country: data.shippingAddress.country || 'India',
      isDefault: data.shippingAddress.isDefault || false
    });
    logger.info('Shipping address created for refill order', { addressId: address._id, patientId: patient._id });
  } else if (data.shippingAddressId) {
    address = await Address.findOne({
      _id: data.shippingAddressId,
      patient: patient._id
    });
    if (!address) throw new AppError('Shipping address not found', 404);
  } else {
    throw new AppError('Shipping address is required (provide shippingAddress object or shippingAddressId)', 400);
  }
  
  // Prepare billing address
  let billingAddress = null;
  let billingAddressSameAsShipping = data.billingAddressSameAsShipping !== false;
  
  if (data.billingAddressSameAsShipping === false && data.billingAddress) {
    billingAddress = {
      firstName: data.billingAddress.firstName || '',
      lastName: data.billingAddress.lastName || '',
      email: data.billingAddress.email || '',
      phoneNumber: data.billingAddress.phoneNumber || data.billingAddress.phone || '',
      streetAddress: data.billingAddress.streetAddress || data.billingAddress.addressLine1 || '',
      streetAddress2: data.billingAddress.streetAddress2 || data.billingAddress.addressLine2 || '',
      city: data.billingAddress.city || '',
      state: data.billingAddress.state || data.billingAddress.stateProvince || '',
      zipCode: data.billingAddress.zipCode || data.billingAddress.postalCode || ''
    };
    billingAddressSameAsShipping = false;
  } else {
    billingAddressSameAsShipping = true;
    if (address) {
      billingAddress = {
        firstName: address.firstName || address.fullName?.split(' ')[0] || '',
        lastName: address.lastName || address.fullName?.split(' ').slice(1).join(' ') || '',
        email: address.email || '',
        phoneNumber: address.phoneNumber || '',
        streetAddress: address.addressLine1 || '',
        streetAddress2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.postalCode || ''
      };
    }
  }
  
  const order = await Order.create({
    patient: patient._id,
    prescription: null,
    items,
    shippingAddress: address._id,
    billingAddress: billingAddress,
    billingAddressSameAsShipping: billingAddressSameAsShipping,
    subtotal,
    shippingCharges,
    tax,
    discount,
    couponCode: undefined,
    totalAmount,
    createdFromCart: false,
    status: 'pending',
    notes: data.orderComment || data.notes || 'Refill Order'
  });
  
  logger.info('Refill order created', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    patientId: patient._id,
    totalAmount: order.totalAmount,
    itemCount: order.items.length,
    productName: 'RefillName'
  });
  
  const savedOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  return {
    ...savedOrder,
    billingAddress: savedOrder.billingAddress || null,
    billingAddressSameAsShipping: savedOrder.billingAddressSameAsShipping !== false
  };
};

// Create order (unified - handles cart, prescription, and custom items)
exports.createOrder = async (userId, data) => {
  const patient = await getPatient(userId);
  const Cart = require('../../models/Cart.model');
  
  // If createFromCart is true, use cart items
  let items = [];
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  let shippingCharges = 0;
  let couponCode = null;
  
  if (data.createFromCart) {
    // Get cart and use cart items
    const cart = await Cart.findOne({ patient: patient._id });
    if (!cart || cart.items.filter(item => !item.isSaved).length === 0) {
      throw new AppError('Cart is empty', 400);
    }
    
    // Get Medicine model for fetching product details
    const Medicine = require('../../models/Medicine.model');
    
    // Convert cart items to order items with full product details
    const itemsPromises = cart.items
      .filter(item => !item.isSaved)
      .map(async (item) => {
        // Ensure productId is present
        if (!item.productId) {
          logger.warn('Cart item missing productId', { item });
          throw new AppError(`Product ID is required for item: ${item.productName}`, 400);
        }
        
        const orderItem = {
          productId: item.productId, // Required - ensures product ID is saved
          productType: item.productType,
          medicationName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          status: 'ordered',
          dosageOption: item.dosageOption || null,
          quantityOption: item.quantityOption || null
        };
        
        // If it's a medication, fetch full product details
        if (item.productType === 'medication' && item.productId) {
          try {
            const medicine = await Medicine.findById(item.productId)
              .select('brand originalPrice salePrice images description generics dosageOptions quantityOptions')
              .lean();
            
            if (medicine) {
              orderItem.brand = medicine.brand;
              orderItem.originalPrice = medicine.originalPrice;
              orderItem.salePrice = medicine.salePrice;
              orderItem.images = medicine.images || {};
              orderItem.description = medicine.description;
              orderItem.generics = medicine.generics || [];
              
              // Get dosage if dosageOption is selected
              if (item.dosageOption && medicine.dosageOptions) {
                const selectedDosage = medicine.dosageOptions.find(
                  d => d._id.toString() === item.dosageOption._id?.toString() || d.name === item.dosageOption.name
                );
                if (selectedDosage) {
                  orderItem.dosage = selectedDosage.name;
                }
              }
            }
          } catch (error) {
            logger.warn('Failed to fetch medicine details for order item', {
              productId: item.productId,
              error: error.message
            });
            // Continue without product details if fetch fails
          }
        }
        
        return orderItem;
      });
    
    items = await Promise.all(itemsPromises);
    
    if (items.length === 0) {
      throw new AppError('No items to order', 400);
    }
    
    subtotal = cart.subtotal;
    tax = cart.tax || (subtotal * 0.03);
    discount = cart.discount || 0;
    shippingCharges = cart.shippingCharges || 10.00;
    couponCode = cart.couponCode;
  } else {
    // Legacy: If prescription provided, load it
    let prescription = null;
    if (data.prescriptionId) {
      prescription = await Prescription.findOne({
        _id: data.prescriptionId,
        patient: patient._id
      });
      if (!prescription) throw new AppError('Prescription not found', 404);
    }
    
    // Create order items from prescription or from data
    if (prescription) {
      // Get Medicine model for finding product IDs
      const Medicine = require('../../models/Medicine.model');
      
      // Convert prescription medications to order items with product IDs
      const itemsPromises = prescription.medications.map(async (med) => {
        let productId = null;
        let productDetails = {};
        
        // Try to find medicine by name to get productId
        try {
          const medicine = await Medicine.findOne({
            productName: { $regex: new RegExp(med.name, 'i') },
            isActive: true,
            visibility: true
          })
            .select('_id brand originalPrice salePrice images description generics')
            .lean();
          
          if (medicine) {
            productId = medicine._id.toString();
            productDetails = {
              brand: medicine.brand,
              originalPrice: medicine.originalPrice,
              salePrice: medicine.salePrice,
              images: medicine.images || {},
              description: medicine.description,
              generics: medicine.generics || []
            };
          }
        } catch (error) {
          logger.warn('Failed to find medicine for prescription medication', {
            medicationName: med.name,
            error: error.message
          });
        }
        
        // Calculate price - use medicine price if found, otherwise default
        const unitPrice = productDetails.salePrice || productDetails.originalPrice || 100;
        const totalPrice = med.quantity * unitPrice;
        
        return {
          prescriptionItem: prescription._id,
          productId: productId || `prescription_${prescription._id}_${med.name.replace(/\s+/g, '_')}`, // Placeholder if not found
          productType: 'medication',
          medicationName: med.name,
          quantity: med.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          status: 'pending',
          ...productDetails // Include product details if found
        };
      });
      
      items = await Promise.all(itemsPromises);
    } else if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      // Create order from custom items array
      const Medicine = require('../../models/Medicine.model');
      
      // Validate and fetch product details for each item
      const itemsPromises = data.items.map(async (item) => {
        if (!item.productId) {
          throw new AppError(`Product ID is required for item: ${item.medicationName}`, 400);
        }
        
        // Fetch full product details for custom items if productId is provided
        if (item.productType === 'medication' && item.productId) {
          try {
            const medicine = await Medicine.findById(item.productId)
              .select('brand originalPrice salePrice images description generics dosageOptions quantityOptions')
              .lean();

            if (medicine) {
              item.brand = medicine.brand;
              item.originalPrice = medicine.originalPrice;
              item.salePrice = medicine.salePrice;
              item.images = medicine.images || {};
              item.description = medicine.description;
              item.generics = medicine.generics || [];
              // Populate dosage if dosageOption is selected
              if (item.dosageOption && medicine.dosageOptions) {
                const selectedDosage = medicine.dosageOptions.find(
                  d => d._id.toString() === item.dosageOption._id?.toString() || d.name === item.dosageOption.name
                );
                if (selectedDosage) {
                  item.dosage = selectedDosage.name;
                }
              }
            }
          } catch (error) {
            logger.warn('Failed to fetch medicine details for custom order item', {
              productId: item.productId,
              error: error.message
            });
          }
        }
        
        // Ensure required fields
        return {
          productId: item.productId, // Required
          productType: item.productType || 'medication',
          medicationName: item.medicationName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          status: 'pending',
          brand: item.brand,
          originalPrice: item.originalPrice,
          salePrice: item.salePrice,
          images: item.images || {},
          description: item.description,
          dosage: item.dosage,
          dosageOption: item.dosageOption || null,
          quantityOption: item.quantityOption || null,
          generics: item.generics || []
        };
      });
      
      items = await Promise.all(itemsPromises);
    } else {
      throw new AppError('Items array is required when not creating from cart or prescription', 400);
    }
    
    // Calculate totals
    subtotal = data.subtotal || items.reduce((sum, item) => sum + item.totalPrice, 0);
    shippingCharges = data.shippingCharges || 50;
    tax = data.tax || (subtotal * 0.18); // 18% GST or 3% for cart
    discount = data.discount || 0;
  }
  
  const totalAmount = data.totalAmount || (subtotal + shippingCharges + tax - discount);
  
  // Handle shipping address - can be provided as object or ID
  let address = null;
  if (data.shippingAddress && typeof data.shippingAddress === 'object') {
    // Extract firstName and lastName
    const firstName = data.shippingAddress.firstName || '';
    const lastName = data.shippingAddress.lastName || '';
    const fullName = data.shippingAddress.fullName || `${firstName} ${lastName}`.trim() || 'Unknown';
    
    // Create new address from shippingAddress object with all required fields
    address = await Address.create({
      patient: patient._id,
      type: data.shippingAddress.type || 'home',
      firstName: firstName || fullName.split(' ')[0] || 'Unknown',
      lastName: lastName || fullName.split(' ').slice(1).join(' ') || '',
      email: data.shippingAddress.email || '',
      fullName: fullName,
      phoneNumber: data.shippingAddress.phoneNumber || data.shippingAddress.phone || '',
      countryCode: data.shippingAddress.countryCode || '+91',
      addressLine1: data.shippingAddress.addressLine1 || data.shippingAddress.streetAddress || data.shippingAddress.streetAddress1 || '',
      addressLine2: data.shippingAddress.addressLine2 || data.shippingAddress.streetAddress2 || '',
      city: data.shippingAddress.city || '',
      state: data.shippingAddress.state || data.shippingAddress.stateProvince || '',
      postalCode: data.shippingAddress.postalCode || data.shippingAddress.zipCode || '',
      country: data.shippingAddress.country || 'India',
      isDefault: data.shippingAddress.isDefault || false
    });
    logger.info('Shipping address created for order', { addressId: address._id, patientId: patient._id });
  } else if (data.shippingAddressId) {
    // Use existing address by ID
    address = await Address.findOne({
      _id: data.shippingAddressId,
      patient: patient._id
    });
    if (!address) throw new AppError('Shipping address not found', 404);
  } else {
    throw new AppError('Shipping address is required (provide shippingAddress object or shippingAddressId)', 400);
  }
  
  // Prepare billing address (according to checkout page)
  let billingAddress = null;
  let billingAddressSameAsShipping = data.billingAddressSameAsShipping !== false; // Default true
  
  if (data.billingAddressSameAsShipping === false && data.billingAddress) {
    // Billing address is different from shipping
    billingAddress = {
      firstName: data.billingAddress.firstName || '',
      lastName: data.billingAddress.lastName || '',
      email: data.billingAddress.email || '',
      phoneNumber: data.billingAddress.phoneNumber || data.billingAddress.phone || '',
      streetAddress: data.billingAddress.streetAddress || data.billingAddress.addressLine1 || '',
      streetAddress2: data.billingAddress.streetAddress2 || data.billingAddress.addressLine2 || '',
      city: data.billingAddress.city || '',
      state: data.billingAddress.state || data.billingAddress.stateProvince || '',
      zipCode: data.billingAddress.zipCode || data.billingAddress.postalCode || ''
    };
    billingAddressSameAsShipping = false;
  } else {
    // Billing address same as shipping (default)
    billingAddressSameAsShipping = true;
    if (address) {
      billingAddress = {
        firstName: address.firstName || address.fullName?.split(' ')[0] || '',
        lastName: address.lastName || address.fullName?.split(' ').slice(1).join(' ') || '',
        email: address.email || '',
        phoneNumber: address.phoneNumber || '',
        streetAddress: address.addressLine1 || '',
        streetAddress2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.postalCode || ''
      };
    }
  }
  
  const order = await Order.create({
    patient: patient._id,
    prescription: data.prescriptionId || null,
    items,
    shippingAddress: address._id,
    billingAddress: billingAddress,
    billingAddressSameAsShipping: billingAddressSameAsShipping,
    subtotal,
    shippingCharges,
    tax,
    discount,
    couponCode: couponCode || undefined,
    totalAmount,
    createdFromCart: !!data.createFromCart,
    status: 'pending',
    notes: data.orderComment || data.notes
  });
  
  // Handle "Create account for later" option (if provided)
  // This is just stored in notes for now, can be extended later for guest checkout
  if (data.createAccount) {
    logger.info('Order created with account creation request', { orderId: order._id });
  }
  
  logger.info('Order created', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    patientId: patient._id,
    totalAmount: order.totalAmount,
    itemCount: order.items.length,
    fromCart: data.createFromCart || false
  });
  
  // If order created from cart, clear cart
  if (data.createFromCart) {
    const cart = await Cart.findOne({ patient: patient._id });
    if (cart) {
      cart.items = cart.items.filter(item => item.isSaved); // Keep saved items
      cart.couponCode = undefined;
      cart.discount = 0;
      cart.subtotal = 0;
      cart.tax = 0;
      cart.shippingCharges = 0;
      cart.totalAmount = 0;
      await cart.save();
    }
  }
  
  const savedOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  return {
    ...savedOrder,
    billingAddress: savedOrder.billingAddress || null,
    billingAddressSameAsShipping: savedOrder.billingAddressSameAsShipping !== false
  };
};
