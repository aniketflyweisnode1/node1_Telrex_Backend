const Order = require('../../models/Order.model');
const Prescription = require('../../models/Prescription.model');
const Patient = require('../../models/Patient.model');
const Address = require('../../models/Address.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get patient from userId (auto-create if doesn't exist)
const getPatient = async (userId) => {
  let patient = await Patient.findOne({ user: userId });
  if (!patient) {
    // Auto-create patient profile if doesn't exist
    patient = await Patient.create({ user: userId });
    logger.info('Patient profile auto-created', { userId, patientId: patient._id });
  }
  return patient;
};

// Get all orders
exports.getOrders = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  const filter = { patient: patient._id };
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  
  // Date range filtering
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }
  
  // Pagination
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Get total count for pagination
  const total = await Order.countDocuments(filter);
  
  // Get orders with pagination
  const orders = await Order.find(filter)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .populate('payment')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Populate product details for each item
  const ordersWithProducts = await Promise.all(orders.map(async (order) => {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return {
        ...order,
        items: [],
        billingAddress: order.billingAddress || null,
        billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
      };
    }
    
    // Fetch product details for all items
    const itemsWithProducts = await Promise.all(order.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item; // Return as-is for non-medication items
      }
      
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        
        if (medicine) {
          return {
            ...item,
            product: medicine // Add full product details
          };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', {
          productId: item.productId,
          error: error.message
        });
      }
      
      return item; // Return original item if product not found
    }));
    
    return {
      ...order,
      items: itemsWithProducts,
      billingAddress: order.billingAddress || null,
      billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
    };
  }));
  
  return {
    orders: ordersWithProducts,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Get single order
exports.getOrderById = async (userId, orderId) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  })
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .populate('payment')
    .lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Populate product details for each item
  let itemsWithProducts = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsWithProducts = await Promise.all(order.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item; // Return as-is for non-medication items
      }
      
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        
        if (medicine) {
          return {
            ...item,
            product: medicine // Add full product details
          };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', {
          productId: item.productId,
          error: error.message
        });
      }
      
      return item; // Return original item if product not found
    }));
  }
  
  // Format order with billing address and populated items
  return {
    ...order,
    items: itemsWithProducts,
    billingAddress: order.billingAddress || null,
    billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
  };
};

// Delete order item (only for pending orders)
exports.deleteOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  if (order.status !== 'pending') {
    throw new AppError('Can only delete items from pending orders', 400);
  }
  
  const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) {
    throw new AppError('Order item not found', 404);
  }
  
  // Remove item
  const removedItem = order.items[itemIndex];
  order.items.splice(itemIndex, 1);
  
  if (order.items.length === 0) {
    throw new AppError('Cannot delete last item. Cancel the order instead.', 400);
  }
  
  // Recalculate totals
  order.subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  order.tax = order.subtotal * 0.18; // 18% GST
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  
  await order.save();
  
  // Populate and return updated order
  const updatedOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  // Populate product details for items
  if (Array.isArray(updatedOrder.items) && updatedOrder.items.length > 0) {
    updatedOrder.items = await Promise.all(updatedOrder.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
  return {
    ...updatedOrder,
    billingAddress: updatedOrder.billingAddress || null,
    billingAddressSameAsShipping: updatedOrder.billingAddressSameAsShipping !== false
  };
};

// Save order item (mark as saved for later - only for pending orders)
exports.saveOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  if (order.status !== 'pending') {
    throw new AppError('Can only save items from pending orders', 400);
  }
  
  const item = order.items.id(itemId);
  if (!item) {
    throw new AppError('Order item not found', 404);
  }
  
  if (item.isSaved) {
    throw new AppError('Item is already saved', 400);
  }
  
  // Mark item as saved
  item.isSaved = true;
  item.status = 'saved';
  
  // Recalculate totals (exclude saved items from totals)
  order.subtotal = order.items
    .filter(item => !item.isSaved)
    .reduce((sum, item) => sum + item.totalPrice, 0);
  order.tax = order.subtotal * 0.18; // 18% GST
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  
  await order.save();
  
  // Populate and return updated order
  const updatedOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  // Populate product details for items
  if (Array.isArray(updatedOrder.items) && updatedOrder.items.length > 0) {
    updatedOrder.items = await Promise.all(updatedOrder.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
  return {
    ...updatedOrder,
    billingAddress: updatedOrder.billingAddress || null,
    billingAddressSameAsShipping: updatedOrder.billingAddressSameAsShipping !== false
  };
};

// Unsave order item (move back to active - only for pending orders)
exports.unsaveOrderItem = async (userId, orderId, itemId) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  if (order.status !== 'pending') {
    throw new AppError('Can only unsave items from pending orders', 400);
  }
  
  const item = order.items.id(itemId);
  if (!item) {
    throw new AppError('Order item not found', 404);
  }
  
  if (!item.isSaved) {
    throw new AppError('Item is not saved', 400);
  }
  
  // Mark item as not saved
  item.isSaved = false;
  item.status = 'pending';
  
  // Recalculate totals (include unsaved items in totals)
  order.subtotal = order.items
    .filter(item => !item.isSaved)
    .reduce((sum, item) => sum + item.totalPrice, 0);
  order.tax = order.subtotal * 0.18; // 18% GST
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  
  await order.save();
  
  // Populate and return updated order
  const updatedOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  // Populate product details for items
  if (Array.isArray(updatedOrder.items) && updatedOrder.items.length > 0) {
    updatedOrder.items = await Promise.all(updatedOrder.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
  return {
    ...updatedOrder,
    billingAddress: updatedOrder.billingAddress || null,
    billingAddressSameAsShipping: updatedOrder.billingAddressSameAsShipping !== false
  };
};

// Update order item quantity (only for pending orders)
exports.updateOrderItemQuantity = async (userId, orderId, itemId, quantity) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  if (order.status !== 'pending') {
    throw new AppError('Can only update items in pending orders', 400);
  }
  
  const item = order.items.id(itemId);
  if (!item) {
    throw new AppError('Order item not found', 404);
  }
  
  // Update quantity and recalculate prices
  item.quantity = quantity;
  item.totalPrice = item.unitPrice * quantity;
  
  // Recalculate order totals
  order.subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  order.tax = order.subtotal * 0.18; // 18% GST
  order.totalAmount = order.subtotal + order.shippingCharges + order.tax - order.discount;
  
  await order.save();
  
  // Populate and return updated order
  const updatedOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  // Populate product details for items
  if (Array.isArray(updatedOrder.items) && updatedOrder.items.length > 0) {
    updatedOrder.items = await Promise.all(updatedOrder.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
  return {
    ...updatedOrder,
    billingAddress: updatedOrder.billingAddress || null,
    billingAddressSameAsShipping: updatedOrder.billingAddressSameAsShipping !== false
  };
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

// Get order invoice
exports.getOrderInvoice = async (userId, orderId) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  const User = require('../../models/User.model');
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  })
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country'
    })
    .populate('prescription')
    .lean();
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Get user details
  const user = await User.findById(patient.user)
    .select('firstName lastName email phoneNumber')
    .lean();
  
  // Populate product details for items
  let itemsWithProducts = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsWithProducts = await Promise.all(order.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics category')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for invoice item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
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
    items: itemsWithProducts,
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

// Cancel order (only for pending/confirmed orders)
exports.cancelOrder = async (userId, orderId, reason) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Only allow cancellation for pending or confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
  }
  
  // Update order status
  order.status = 'cancelled';
  if (reason) {
    order.notes = order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
  }
  await order.save();
  
  logger.info('Order cancelled', { orderId: order._id, orderNumber: order.orderNumber, reason });
  
  // Populate and return cancelled order
  const cancelledOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  // Populate product details for items
  if (Array.isArray(cancelledOrder.items) && cancelledOrder.items.length > 0) {
    cancelledOrder.items = await Promise.all(cancelledOrder.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
  return {
    ...cancelledOrder,
    billingAddress: cancelledOrder.billingAddress || null,
    billingAddressSameAsShipping: cancelledOrder.billingAddressSameAsShipping !== false
  };
};

// Reorder (create new order from existing order)
exports.reorder = async (userId, orderId) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  // Get original order
  const originalOrder = await Order.findOne({
    _id: orderId,
    patient: patient._id
  })
    .populate('shippingAddress')
    .lean();
  
  if (!originalOrder) throw new AppError('Order not found', 404);
  
  // Create new order items from original order
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
  
  // Calculate totals
  const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.18; // 18% GST
  const shippingCharges = originalOrder.shippingCharges || 10.00;
  const discount = 0; // Reset discount for reorder
  const totalAmount = subtotal + shippingCharges + tax - discount;
  
  // Create new order
  const newOrder = await Order.create({
    patient: patient._id,
    prescription: originalOrder.prescription || null,
    items: newItems,
    shippingAddress: originalOrder.shippingAddress._id || originalOrder.shippingAddress,
    billingAddress: originalOrder.billingAddress || null,
    billingAddressSameAsShipping: originalOrder.billingAddressSameAsShipping !== false,
    subtotal,
    shippingCharges,
    tax,
    discount,
    totalAmount,
    status: 'pending',
    notes: `Reordered from order ${originalOrder.orderNumber}`
  });
  
  logger.info('Order recreated', {
    originalOrderId: originalOrder._id,
    newOrderId: newOrder._id,
    orderNumber: newOrder.orderNumber
  });
  
  // Populate and return new order
  const savedOrder = await Order.findById(newOrder._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  // Populate product details for items
  if (Array.isArray(savedOrder.items) && savedOrder.items.length > 0) {
    savedOrder.items = await Promise.all(savedOrder.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
  return {
    ...savedOrder,
    billingAddress: savedOrder.billingAddress || null,
    billingAddressSameAsShipping: savedOrder.billingAddressSameAsShipping !== false
  };
};

// Get orders summary/stats
exports.getOrdersSummary = async (userId) => {
  const patient = await getPatient(userId);
  
  const orders = await Order.find({ patient: patient._id }).lean();
  
  const summary = {
    total: orders.length,
    byStatus: {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      returned: orders.filter(o => o.status === 'returned').length
    },
    byPaymentStatus: {
      pending: orders.filter(o => o.paymentStatus === 'pending').length,
      paid: orders.filter(o => o.paymentStatus === 'paid').length,
      failed: orders.filter(o => o.paymentStatus === 'failed').length,
      refunded: orders.filter(o => o.paymentStatus === 'refunded').length
    },
    totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    totalPaid: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  };
  
  return summary;
};

// Update order notes
exports.updateOrderNotes = async (userId, orderId, notes) => {
  const patient = await getPatient(userId);
  const Medicine = require('../../models/Medicine.model');
  
  const order = await Order.findOne({
    _id: orderId,
    patient: patient._id
  });
  
  if (!order) throw new AppError('Order not found', 404);
  
  // Only allow updating notes for pending/confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError(`Cannot update notes for order with status: ${order.status}`, 400);
  }
  
  order.notes = notes;
  await order.save();
  
  // Populate and return updated order
  const updatedOrder = await Order.findById(order._id)
    .populate({
      path: 'shippingAddress',
      select: 'type firstName lastName email fullName phoneNumber countryCode addressLine1 addressLine2 city state postalCode country isDefault'
    })
    .populate('prescription')
    .lean();
  
  // Populate product details for items
  if (Array.isArray(updatedOrder.items) && updatedOrder.items.length > 0) {
    updatedOrder.items = await Promise.all(updatedOrder.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        if (medicine) {
          return { ...item, product: medicine };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', { productId: item.productId, error: error.message });
      }
      return item;
    }));
  }
  
  return {
    ...updatedOrder,
    billingAddress: updatedOrder.billingAddress || null,
    billingAddressSameAsShipping: updatedOrder.billingAddressSameAsShipping !== false
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
    totalAmount,
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
