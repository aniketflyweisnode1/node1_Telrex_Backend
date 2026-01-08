const Refill = require('../../models/Refill.model');
const Medicine = require('../../models/Medicine.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Helper function to get patient
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    throw new AppError('Patient profile not found', 404);
  }
  return patient;
};

// Create refill
exports.createRefill = async (userId, data) => {
  const patient = await getPatient(userId);

  // Validate medicine exists
  const medicine = await Medicine.findOne({
    _id: data.medicineId,
    isActive: true
  });

  if (!medicine) {
    throw new AppError('Medicine not found or not active', 404);
  }

  // Create refill
  const refill = await Refill.create({
    patient: patient._id,
    medicine: medicine._id,
    status: data.status || 'pending',
    medicationName: data.medicationName || medicine.productName,
    quantity: data.quantity || 1,
    dosage: data.dosage || '',
    frequency: data.frequency || '',
    instructions: data.instructions || '',
    unitPrice: data.unitPrice || medicine.salePrice || medicine.originalPrice || 0,
    totalPrice: data.totalPrice || ((data.unitPrice || medicine.salePrice || medicine.originalPrice || 0) * (data.quantity || 1)),
    notes: data.notes || '',
    // Auto-refill settings - "Automatically get my refill(s) from TeleRx!"
    autoRefill: data.autoRefill !== undefined ? data.autoRefill : false, // Explicitly handle boolean
    autoRefillFrequency: data.autoRefillFrequency || 'monthly',
    maxRefills: data.maxRefills || 3
  });

  // Populate and return
  return await Refill.findById(refill._id)
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
    })
    .populate({
      path: 'order',
      select: 'orderNumber status totalAmount'
    })
    .lean();
};

// Get all refills
exports.getRefills = async (userId, query) => {
  const patient = await getPatient(userId);
  
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter = { patient: patient._id };
  
  // Status filter - default to only fresh/active refills (pending and approved)
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  } else if (!query.status || query.status !== 'all') {
    // Default: only show pending and approved
    filter.status = { $in: ['pending', 'approved'] };
  }
  
  // Medicine filter
  if (query.medicineId) {
    filter.medicine = query.medicineId;
  }
  
  // Get refills
  const refills = await Refill.find(filter)
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
    })
    .populate({
      path: 'order',
      select: 'orderNumber status totalAmount'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Get total count
  const total = await Refill.countDocuments(filter);
  
  return {
    refills,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get refill by ID
exports.getRefillById = async (userId, refillId) => {
  const patient = await getPatient(userId);
  
  const refill = await Refill.findOne({
    _id: refillId,
    patient: patient._id
  })
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
    })
    .populate({
      path: 'order',
      select: 'orderNumber status totalAmount'
    })
    .lean();
  
  if (!refill) {
    throw new AppError('Refill not found', 404);
  }
  
  return refill;
};

// Update refill
exports.updateRefill = async (userId, refillId, data) => {
  const patient = await getPatient(userId);
  
  const refill = await Refill.findOne({
    _id: refillId,
    patient: patient._id,
    status: 'pending' // Only pending refills can be updated
  });
  
  if (!refill) {
    throw new AppError('Refill not found or cannot be updated (only pending refills can be updated)', 404);
  }
  
  // Update fields
  if (data.quantity !== undefined) {
    refill.quantity = data.quantity;
    // Recalculate total price
    refill.totalPrice = refill.unitPrice * data.quantity;
  }
  if (data.dosage !== undefined) refill.dosage = data.dosage;
  if (data.frequency !== undefined) refill.frequency = data.frequency;
  if (data.instructions !== undefined) refill.instructions = data.instructions;
  if (data.notes !== undefined) refill.notes = data.notes;
  if (data.autoRefill !== undefined) refill.autoRefill = data.autoRefill;
  if (data.autoRefillFrequency !== undefined) refill.autoRefillFrequency = data.autoRefillFrequency;
  
  // Handle status changes and date updates
  if (data.status && data.status !== refill.status) {
    const oldStatus = refill.status;
    refill.status = data.status;
    
    // Update status-specific dates
    const now = new Date();
    if (data.status === 'approved' && oldStatus !== 'approved') {
      refill.approvedDate = now;
    } else if (data.status === 'rejected' && oldStatus !== 'rejected') {
      refill.rejectedDate = now;
      if (data.rejectionReason) refill.rejectionReason = data.rejectionReason;
    } else if (data.status === 'completed' && oldStatus !== 'completed') {
      refill.completedDate = now;
    } else if (data.status === 'cancelled' && oldStatus !== 'cancelled') {
      refill.cancelledDate = now;
    } else if (data.status === 'skipped' && oldStatus !== 'skipped') {
      refill.skippedDate = now;
      if (data.skipReason) refill.skipReason = data.skipReason;
    }
  }
  
  await refill.save();
  
  // Return populated refill
  return await Refill.findById(refill._id)
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
    })
    .populate({
      path: 'order',
      select: 'orderNumber status totalAmount'
    })
    .lean();
};

// Delete refill
exports.deleteRefill = async (userId, refillId) => {
  const patient = await getPatient(userId);
  
  const refill = await Refill.findOneAndDelete({
    _id: refillId,
    patient: patient._id
  });
  
  if (!refill) {
    throw new AppError('Refill not found', 404);
  }
  
  return { message: 'Refill deleted successfully' };
};

// Cancel refill
exports.cancelRefill = async (userId, refillId) => {
  const patient = await getPatient(userId);
  
  const refill = await Refill.findOne({
    _id: refillId,
    patient: patient._id,
    status: 'pending' // Only pending refills can be cancelled
  });
  
  if (!refill) {
    throw new AppError('Refill not found or cannot be cancelled (only pending refills can be cancelled)', 404);
  }
  
  refill.status = 'cancelled';
  refill.cancelledDate = new Date();
  await refill.save();
  
  return await Refill.findById(refill._id)
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
    })
    .lean();
};

// Skip refill (skip this month)
exports.skipRefill = async (userId, refillId, data) => {
  const patient = await getPatient(userId);
  
  const refill = await Refill.findOne({
    _id: refillId,
    patient: patient._id,
    status: 'pending' // Only pending refills can be skipped
  });
  
  if (!refill) {
    throw new AppError('Refill not found or cannot be skipped (only pending refills can be skipped)', 404);
  }
  
  refill.status = 'skipped';
  refill.skippedDate = new Date();
  if (data.skipReason) refill.skipReason = data.skipReason;
  if (data.notes) refill.notes = data.notes;
  await refill.save();
  
  return await Refill.findById(refill._id)
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
    })
    .lean();
};

// Create order from approved refills (checkout) - supports multiple selected refills
exports.createOrderFromRefill = async (userId, orderData) => {
  const patient = await getPatient(userId);
  const orderService = require('../order/order.service');
  
  // Get selected refill IDs (checked items from frontend)
  const selectedRefillIds = orderData.selectedRefillIds || [];
  
  if (!selectedRefillIds || selectedRefillIds.length === 0) {
    throw new AppError('At least one refill must be selected for checkout', 400);
  }
  
  // Get all selected refills - must be approved
  const refills = await Refill.find({
    _id: { $in: selectedRefillIds },
    patient: patient._id,
    status: 'approved' // Only approved refills can be converted to orders
  })
    .populate('medicine')
    .lean();
  
  if (refills.length === 0) {
    throw new AppError('No approved refills found. Only approved refills can be converted to orders.', 404);
  }
  
  if (refills.length !== selectedRefillIds.length) {
    throw new AppError('Some selected refills are not approved or not found', 400);
  }
  
  // Prepare order items from all selected refills
  const orderItems = [];
  const refillIds = [];
  
  for (const refill of refills) {
    // Check if medicine is still available
    const medicine = await Medicine.findOne({
      _id: refill.medicine._id,
      isActive: true,
      visibility: true,
      status: { $in: ['in_stock', 'low_stock'] }
    });
    
    if (!medicine) {
      throw new AppError(`Medicine ${refill.medicationName || refill.medicine.productName} is no longer available`, 400);
    }
    
    // Prepare order item from refill
    const currentPrice = medicine.salePrice || medicine.originalPrice || refill.unitPrice || 0;
    const quantity = refill.quantity || 1;
    
    orderItems.push({
      productId: refill.medicine._id.toString(),
      productType: 'medication',
      medicationName: refill.medicationName || medicine.productName,
      brand: medicine.brand,
      originalPrice: medicine.originalPrice,
      salePrice: currentPrice,
      images: medicine.images || { thumbnail: '', gallery: [] },
      description: medicine.description,
      dosage: refill.dosage,
      dosageOption: medicine.dosageOptions?.find(d => d.name === refill.dosage) || null,
      quantityOption: medicine.quantityOptions?.[0] || null,
      generics: medicine.generics || [],
      quantity: quantity,
      unitPrice: currentPrice,
      totalPrice: currentPrice * quantity,
      status: 'ordered',
      isSaved: false
    });
    
    refillIds.push(refill._id);
  }
  
  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingCharges = orderData.shippingCharges || 10.00;
  const tax = orderData.tax || (subtotal * 0.02); // 2% tax as shown in image
  const discount = orderData.discount || 0;
  const totalAmount = subtotal + shippingCharges + tax - discount;
  
  // Handle shipping address - extract and validate (pass directly to order service)
  if (!orderData.shippingAddress || typeof orderData.shippingAddress !== 'object') {
    throw new AppError('Shipping address is required', 400);
  }
  
  // Extract and validate address fields from form
  const firstName = (orderData.shippingAddress.firstName || '').trim();
  const lastName = (orderData.shippingAddress.lastName || '').trim();
  const email = (orderData.shippingAddress.email || orderData.shippingAddress.emailAddress || '').trim();
  const phone = (orderData.shippingAddress.phone || orderData.shippingAddress.phoneNumber || '').trim();
  const streetAddress1 = (orderData.shippingAddress.streetAddress1 || orderData.shippingAddress.addressLine1 || orderData.shippingAddress.streetAddress || '').trim();
  const streetAddress2 = (orderData.shippingAddress.streetAddress2 || orderData.shippingAddress.addressLine2 || '').trim();
  const state = (orderData.shippingAddress.state || orderData.shippingAddress.stateProvince || '').trim();
  const city = (orderData.shippingAddress.city || '').trim();
  const zipCode = (orderData.shippingAddress.zipCode || orderData.shippingAddress.postalCode || orderData.shippingAddress.zip || '').trim();
  
  // Validate required fields
  if (!firstName) throw new AppError('First name is required', 400);
  if (!lastName) throw new AppError('Last name is required', 400);
  if (!email) throw new AppError('Email is required', 400);
  if (!phone) throw new AppError('Phone number is required', 400);
  if (!streetAddress1) throw new AppError('Street address is required', 400);
  if (!city) throw new AppError('City is required', 400);
  if (!state) throw new AppError('State is required', 400);
  if (!zipCode) throw new AppError('Postal/Zip code is required', 400);
  
  // Build full name
  const fullName = orderData.shippingAddress.fullName || `${firstName} ${lastName}`.trim() || 'Unknown';
  
  // Extract country code from phone if not provided
  let countryCode = orderData.shippingAddress.countryCode || '+1';
  if (phone && phone.startsWith('+')) {
    const match = phone.match(/^(\+\d{1,3})/);
    if (match) countryCode = match[1];
  }
  if (!countryCode || countryCode.trim() === '') countryCode = '+1';
  
  // Clean phone number
  const cleanPhone = phone ? phone.replace(/\s/g, '') : phone;
  
  // Prepare shipping address object for order service (will be saved in order model by order service)
  const shippingAddressForOrder = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    fullName: fullName,
    phoneNumber: cleanPhone,
    phone: cleanPhone, // Also include 'phone' for compatibility
    countryCode: countryCode,
    addressLine1: streetAddress1,
    streetAddress: streetAddress1, // Also include 'streetAddress' for compatibility
    streetAddress1: streetAddress1, // Also include 'streetAddress1' for compatibility
    addressLine2: streetAddress2 && streetAddress2.trim() !== '' ? streetAddress2 : undefined,
    streetAddress2: streetAddress2 && streetAddress2.trim() !== '' ? streetAddress2 : undefined,
    city: city,
    state: state,
    stateProvince: state, // Also include 'stateProvince' for compatibility
    postalCode: zipCode,
    zipCode: zipCode, // Also include 'zipCode' for compatibility
    zip: zipCode, // Also include 'zip' for compatibility
    country: orderData.shippingAddress.country || 'USA',
    type: orderData.shippingAddress.type || 'home'
  };
  
  // Prepare billing address - checkbox "My billing and shipping address are the same"
  const billingAddressSameAsShipping = orderData.billingAddressSameAsShipping !== false; // Default true
  
  // Billing address (same as shipping if checkbox checked)
  const billingAddress = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phoneNumber: cleanPhone,
    streetAddress: streetAddress1,
    city: city,
    state: state,
    zipCode: zipCode
  };
  
  // Create order data - pass address directly to order service (it will save in order model)
  const orderPayload = {
    items: orderItems,
    shippingAddress: shippingAddressForOrder, // Pass as object, order service will create Address document and save in order
    billingAddress: billingAddress,
    billingAddressSameAsShipping: billingAddressSameAsShipping,
    subtotal: subtotal,
    shippingCharges: shippingCharges,
    tax: tax,
    discount: discount,
    totalAmount: totalAmount,
    notes: orderData.notes || orderData.orderComment || `Refill order for ${refills.map(r => r.medicationName || r.medicine.productName).join(', ')}`,
    createAccount: orderData.createAccount || false
  };
  
  // Create order using order service (it will handle address creation and save in order model)
  const order = await orderService.createOrder(userId, orderPayload);
  
  // Link all refills to order and update status to completed
  await Refill.updateMany(
    { _id: { $in: refillIds } },
    {
      $set: {
        order: order._id,
        status: 'completed',
        completedDate: new Date()
      }
    }
  );
  
  // Return order with refill info
  return {
    ...order,
    refills: refills.map(r => ({
      refillNumber: r.refillNumber,
      refillId: r._id,
      medicationName: r.medicationName
    }))
  };
};

// Get all refill orders (orders created from refills)
exports.getRefillOrders = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  const Order = require('../../models/Order.model');
  const Medicine = require('../../models/Medicine.model');
  
  // Find all refills that have orders (completed refills)
  const refillsWithOrders = await Refill.find({
    patient: patient._id,
    order: { $exists: true, $ne: null }
  })
    .select('order')
    .lean();
  
  // Extract unique order IDs
  const orderIds = [...new Set(refillsWithOrders.map(r => r.order.toString()))];
  
  if (orderIds.length === 0) {
    return {
      orders: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    };
  }
  
  // Build filter for orders
  const filter = {
    _id: { $in: orderIds },
    patient: patient._id
  };
  
  // Status filter
  if (query.status) {
    filter.status = query.status;
  }
  
  // Payment status filter
  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }
  
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
  
  // Get total count
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
  
  // Get refills for each order and populate product details
  const ordersWithRefills = await Promise.all(orders.map(async (order) => {
    // Get refills linked to this order
    const orderRefills = await Refill.find({
      order: order._id,
      patient: patient._id
    })
      .populate({
        path: 'medicine',
        select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
      })
      .lean();
    
    // Populate product details for order items
    let itemsWithProducts = [];
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsWithProducts = await Promise.all(order.items.map(async (item) => {
        if (!item.productId || item.productType !== 'medication') {
          return item;
        }
        
        try {
          const medicine = await Medicine.findById(item.productId)
            .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
            .lean();
          
          if (medicine) {
            return {
              ...item,
              product: medicine
            };
          }
        } catch (error) {
          logger.warn('Failed to fetch medicine for order item', {
            productId: item.productId,
            error: error.message
          });
        }
        
        return item;
      }));
    }
    
    return {
      ...order,
      items: itemsWithProducts,
      refills: orderRefills.map(r => ({
        _id: r._id,
        refillNumber: r.refillNumber,
        medicationName: r.medicationName,
        quantity: r.quantity,
        dosage: r.dosage,
        frequency: r.frequency,
        instructions: r.instructions,
        status: r.status,
        requestedDate: r.requestedDate,
        completedDate: r.completedDate,
        medicine: r.medicine
      })),
      billingAddress: order.billingAddress || null,
      billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
    };
  }));
  
  return {
    orders: ordersWithRefills,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get refill order by ID
exports.getRefillOrderById = async (userId, orderId) => {
  const patient = await getPatient(userId);
  const Order = require('../../models/Order.model');
  const Medicine = require('../../models/Medicine.model');
  
  // Check if order exists and belongs to patient
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
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  // Check if this order has refills linked to it
  const orderRefills = await Refill.find({
    order: order._id,
    patient: patient._id
  })
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug'
    })
    .lean();
  
  // If no refills found, this is not a refill order
  if (orderRefills.length === 0) {
    throw new AppError('This order is not a refill order', 404);
  }
  
  // Populate product details for order items
  let itemsWithProducts = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsWithProducts = await Promise.all(order.items.map(async (item) => {
      if (!item.productId || item.productType !== 'medication') {
        return item;
      }
      
      try {
        const medicine = await Medicine.findById(item.productId)
          .select('productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive')
          .lean();
        
        if (medicine) {
          return {
            ...item,
            product: medicine
          };
        }
      } catch (error) {
        logger.warn('Failed to fetch medicine for order item', {
          productId: item.productId,
          error: error.message
        });
      }
      
      return item;
    }));
  }
  
  return {
    ...order,
    items: itemsWithProducts,
    refills: orderRefills.map(r => ({
      _id: r._id,
      refillNumber: r.refillNumber,
      medicationName: r.medicationName,
      quantity: r.quantity,
      dosage: r.dosage,
      frequency: r.frequency,
      instructions: r.instructions,
      status: r.status,
      requestedDate: r.requestedDate,
      approvedDate: r.approvedDate,
      completedDate: r.completedDate,
      notes: r.notes,
      autoRefill: r.autoRefill,
      autoRefillFrequency: r.autoRefillFrequency,
      medicine: r.medicine
    })),
    billingAddress: order.billingAddress || null,
    billingAddressSameAsShipping: order.billingAddressSameAsShipping !== false
  };
};
