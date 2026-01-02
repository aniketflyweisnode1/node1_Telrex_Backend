const Order = require('../../models/Order.model');
const Prescription = require('../../models/Prescription.model');
const Patient = require('../../models/Patient.model');
const Address = require('../../models/Address.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get all orders
exports.getOrders = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const filter = { patient: patient._id };
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  
  const orders = await Order.find(filter)
    .populate('shippingAddress')
    .populate('prescription')
    .populate('payment')
    .sort({ createdAt: -1 })
    .lean();
  
  // Format orders with billing address
  return orders.map(order => ({
    ...order,
    billingAddress: order.billingAddress || null,
    billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
  }));
};

// Get single order
exports.getOrderById = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  })
    .populate('shippingAddress')
    .populate('prescription')
    .populate('payment')
    .lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Format order with billing address
  return {
    ...order,
    billingAddress: order.billingAddress || null,
    billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
  };
};

// Create order from cart
exports.createOrderFromCart = async (userId, data) => {
  const patient = await getPatient(userId);
  const Cart = require('../../models/Cart.model');
  
  // Get cart
  const cart = await Cart.findOne({ patient: patient._id });
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }
  
  // Verify address
  const address = await Address.findOne({
    _id: data.shippingAddressId,
    patient: patient._id
  });
  if (!address) throw new AppError('Address not found', 404);
  
  // Convert cart items to order items
  const items = cart.items
    .filter(item => !item.isSaved) // Only include non-saved items
    .map(item => ({
      productId: item.productId,
      productType: item.productType,
      medicationName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      status: 'ordered'
    }));
  
  if (items.length === 0) {
    throw new AppError('No items to order', 400);
  }
  
  // Calculate totals from cart
  const subtotal = cart.subtotal;
  const shippingCharges = data.shippingCharges || cart.shippingCharges || 10.00;
  const tax = cart.tax || (subtotal * 0.03); // 3% tax
  const discount = cart.discount || 0;
  const totalAmount = subtotal + shippingCharges + tax - discount;
  
  // Prepare billing address
  let billingAddress = null;
  let billingAddressSameAsShipping = true;
  
  if (data.billingAddress) {
    billingAddress = data.billingAddress;
    billingAddressSameAsShipping = data.billingAddressSameAsShipping !== false;
  } else if (address) {
    // Default to shipping address if billing address not provided
    billingAddress = {
      firstName: address.fullName?.split(' ')[0] || '',
      lastName: address.fullName?.split(' ').slice(1).join(' ') || '',
      email: '',
      phoneNumber: address.phoneNumber || '',
      streetAddress: address.addressLine1 || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.postalCode || ''
    };
  }
  
  // Create order
  const order = await Order.create({
    patient: patient._id,
    items,
    shippingAddress: address._id,
    billingAddress: billingAddress,
    billingAddressSameAsShipping: billingAddressSameAsShipping,
    subtotal,
    shippingCharges,
    tax,
    discount,
    totalAmount,
    status: 'pending',
    notes: data.orderComment || data.notes
  });
  
  logger.info('Order created from cart', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    patientId: patient._id,
    totalAmount: order.totalAmount,
    itemCount: order.items.length
  });
  
  // Link doctor's notes to order if any
  const DoctorsNote = require('../../models/DoctorsNote.model');
  const doctorsNoteItems = cart.items.filter(item => item.productType === 'doctors_note');
  if (doctorsNoteItems.length > 0) {
    for (const item of doctorsNoteItems) {
      await DoctorsNote.updateOne(
        { _id: item.productId, patient: patient._id },
        { order: order._id, status: 'processing' }
      );
    }
  }
  
  // Clear cart after order creation
  cart.items = cart.items.filter(item => item.isSaved); // Keep saved items
  cart.couponCode = undefined;
  cart.discount = 0;
  cart.subtotal = 0;
  cart.tax = 0;
  cart.shippingCharges = 0;
  cart.totalAmount = 0;
  await cart.save();
  
  return await Order.findById(order._id)
    .populate('shippingAddress');
};

// Create order from prescription (legacy) or from cart
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
    
    // Convert cart items to order items
    items = cart.items
      .filter(item => !item.isSaved)
      .map(item => ({
        productId: item.productId,
        productType: item.productType,
        medicationName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        status: 'ordered'
      }));
    
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
      items = prescription.medications.map(med => ({
        prescriptionItem: prescription._id,
        medicationName: med.name,
        quantity: med.quantity,
        unitPrice: 100, // TODO: Get from medication database
        totalPrice: med.quantity * 100,
        status: 'pending'
      }));
    } else if (data.items) {
      items = data.items;
    }
    
    // Calculate totals
    subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    shippingCharges = data.shippingCharges || 50;
    tax = subtotal * 0.18; // 18% GST
    discount = data.discount || 0;
  }
  
  const totalAmount = subtotal + shippingCharges + tax - discount;
  
  // Verify address
  const address = await Address.findOne({
    _id: data.shippingAddressId,
    patient: patient._id
  });
  if (!address) throw new AppError('Address not found', 404);
  
  // Prepare billing address
  let billingAddress = null;
  let billingAddressSameAsShipping = true;
  
  if (data.billingAddress) {
    billingAddress = data.billingAddress;
    billingAddressSameAsShipping = data.billingAddressSameAsShipping !== false;
  } else if (address) {
    billingAddress = {
      firstName: address.fullName?.split(' ')[0] || '',
      lastName: address.fullName?.split(' ').slice(1).join(' ') || '',
      email: '',
      phoneNumber: address.phoneNumber || '',
      streetAddress: address.addressLine1 || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.postalCode || ''
    };
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
    totalAmount,
    status: 'pending',
    notes: data.orderComment || data.notes
  });
  
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
    .populate('shippingAddress')
    .populate('prescription')
    .lean();
  
  return {
    ...savedOrder,
    billingAddress: savedOrder.billingAddress || null,
    billingAddressSameAsShipping: savedOrder.billingAddressSameAsShipping !== false
  };
};

// Delete order item
exports.deleteOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  if (order.status !== 'pending') {
    throw new AppError('Cannot modify order in current status', 400);
  }
  
  // Find item by _id (handle both string and ObjectId)
  const itemIndex = order.items.findIndex(item => {
    if (!item._id) return false;
    return item._id.toString() === itemId.toString();
  });
  
  if (itemIndex === -1) {
    throw new AppError('Order item not found', 404);
  }
  
  // Remove item from array
  order.items.splice(itemIndex, 1);
  
  // Check if order has any items left
  if (order.items.length === 0) {
    throw new AppError('Cannot delete the last item from order. Please cancel the order instead.', 400);
  }
  
  // Recalculate totals
  order.subtotal = order.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  
  await order.save();
  
  return await Order.findById(order._id)
    .populate('shippingAddress')
    .populate('payment')
    .lean();
};

// Save order item (mark as saved)
exports.saveOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  const item = order.items.id(itemId);
  if (!item) throw new AppError('Order item not found', 404);
  
  item.isSaved = true;
  item.status = 'saved';
  await order.save();
  
  return await Order.findById(order._id)
    .populate('shippingAddress')
    .populate('payment')
    .lean();
};

// Update order item quantity
exports.updateOrderItemQuantity = async (userId, orderId, itemId, quantity) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  if (order.status !== 'pending') {
    throw new AppError('Cannot modify order in current status', 400);
  }
  
  const item = order.items.id(itemId);
  if (!item) throw new AppError('Order item not found', 404);
  
  item.quantity = quantity;
  item.totalPrice = item.unitPrice * quantity;
  
  // Recalculate totals
  order.subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  
  await order.save();
  
  return await Order.findById(order._id)
    .populate('shippingAddress')
    .populate('payment')
    .lean();
};

// Reorder
exports.reorder = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const oldOrder = await Order.findOne({
    _id: orderId,
    patient: patient._id
  }).lean();
  
  if (!oldOrder) throw new AppError('Order not found', 404);
  
  const newOrder = await Order.create({
    patient: oldOrder.patient,
    prescription: oldOrder.prescription,
    items: oldOrder.items.map(item => ({
      productId: item.productId,
      productType: item.productType,
      medicationName: item.medicationName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      status: 'pending'
    })),
    shippingAddress: oldOrder.shippingAddress,
    billingAddress: oldOrder.billingAddress,
    billingAddressSameAsShipping: oldOrder.billingAddressSameAsShipping !== false,
    subtotal: oldOrder.subtotal,
    shippingCharges: oldOrder.shippingCharges,
    tax: oldOrder.tax,
    discount: 0,
    totalAmount: oldOrder.subtotal + oldOrder.shippingCharges + oldOrder.tax
  });
  
  const savedOrder = await Order.findById(newOrder._id)
    .populate('shippingAddress')
    .lean();
  
  logger.info('Order recreated (reorder)', {
    newOrderId: newOrder._id,
    newOrderNumber: newOrder.orderNumber,
    originalOrderId: orderId,
    patientId: oldOrder.patient
  });
  
  return {
    ...savedOrder,
    billingAddress: savedOrder.billingAddress || null,
    billingAddressSameAsShipping: savedOrder.billingAddressSameAsShipping !== false
  };
};

// Get order status
exports.getOrderStatus = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  }).lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery
  };
};

// Get order tracking
exports.getOrderTracking = async (userId, orderId) => {
  const patient = await getPatient(userId);
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  }).lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
    deliveredAt: order.deliveredAt,
    currentLocation: 'In transit', // TODO: Integrate with shipping provider
    timeline: [
      { status: 'pending', date: order.createdAt },
      { status: order.status, date: order.updatedAt }
    ]
  };
};

