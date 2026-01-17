const Payment = require('../../models/Payment.model');
const Patient = require('../../models/Patient.model');
const Order = require('../../models/Order.model');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');

/**
 * Get transaction history for a patient
 * @param {string} patientId - Patient ID
 * @param {object} query - Query parameters (page, limit, status, paymentMethod, startDate, endDate, sortBy, sortOrder)
 * @returns {Promise<object>} Transaction history with pagination
 */
exports.getTransactionHistory = async (patientId, query = {}) => {
  // Validate patientId
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  const {
    page = 1,
    limit = 10,
    status, // 'pending', 'processing', 'success', 'failed', 'refunded', 'cancelled'
    paymentMethod, // 'card', 'upi', 'netbanking', 'wallet'
    paymentGateway, // 'stripe'
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search, // Search by paymentId, transactionId, order number, invoice number
    type, // Filter by transaction type: 'Refill', 'Excuse', 'Shopping'
    minAmount, // Minimum amount filter
    maxAmount // Maximum amount filter
  } = query;

  // Convert patientId to ObjectId for consistent querying
  const patientObjectId = new mongoose.Types.ObjectId(patientId);

  // Build base filter with ObjectId
  const baseFilter = {
    patient: patientObjectId
  };

  // Build all filter conditions
  const filterConditions = { ...baseFilter };

  // Status filter
  if (status) {
    filterConditions.paymentStatus = status;
  }

  // Payment method filter
  if (paymentMethod) {
    filterConditions.paymentMethod = paymentMethod;
  }

  // Payment gateway filter
  if (paymentGateway) {
    filterConditions.paymentGateway = paymentGateway;
  }

  // Date range filter
  if (startDate || endDate) {
    filterConditions.createdAt = {};
    if (startDate) {
      filterConditions.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filterConditions.createdAt.$lte = new Date(endDate);
    }
  }

  // Amount range filter
  if (minAmount !== undefined || maxAmount !== undefined) {
    filterConditions.amount = {};
    if (minAmount !== undefined) {
      filterConditions.amount.$gte = parseFloat(minAmount);
    }
    if (maxAmount !== undefined) {
      filterConditions.amount.$lte = parseFloat(maxAmount);
    }
  }

  // Build final filter - handle search separately
  // Note: For order number and invoice number search, we'll need to search after fetching and populate
  let filter;
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    const searchConditions = {
      $or: [
        { paymentId: searchRegex },
        { transactionId: searchRegex },
        { stripePaymentIntentId: searchRegex }
      ]
    };
    
    // If search starts with "INV-", also search for invoice number pattern
    if (search.toUpperCase().startsWith('INV-')) {
      // Extract the part after INV- to search in order number
      const invoiceSearch = search.replace(/^INV-/i, '');
      if (invoiceSearch) {
        searchConditions.$or.push({ 
          // This will be handled after populate for order number
        });
      }
    }
    
    // Combine using $and
    filter = {
      $and: [
        filterConditions,
        searchConditions
      ]
    };
  } else {
    filter = filterConditions;
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Get transactions with populated order details
  const transactions = await Payment.find(filter)
    .populate({
      path: 'order',
      select: 'orderNumber totalAmount subtotal shippingCharges tax discount paymentStatus orderStatus items prescription createdAt'
    })
    .populate({
      path: 'patient',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber'
      }
    })
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count for pagination
  const total = await Payment.countDocuments(filter);

  // Add transaction type based on order items and prescription references
  let transactionsWithType = transactions.map(transaction => {
    let transactionType = 'Shopping'; // Default type
    
    if (transaction.order) {
      // Check if order has a prescription reference (refill order)
      if (transaction.order.prescription) {
        transactionType = 'Refill';
      }
      // Check if any order item has prescriptionItem reference (refill order)
      else if (transaction.order.items && transaction.order.items.length > 0) {
        const hasPrescriptionItem = transaction.order.items.some(item => item.prescriptionItem);
        
        if (hasPrescriptionItem) {
          transactionType = 'Refill';
        } else {
          // Determine type based on product types
          const items = transaction.order.items;
          const productTypes = items.map(item => item.productType).filter(Boolean);
          
          if (productTypes.length > 0) {
            const uniqueTypes = [...new Set(productTypes)];
            
            // If all items are doctors_note, it's an Excuse
            if (uniqueTypes.length === 1 && uniqueTypes[0] === 'doctors_note') {
              transactionType = 'Excuse';
            }
            // If all items are medication (but no prescription ref), it's still Shopping
            // (only prescription-based orders are Refill)
            else {
              transactionType = 'Shopping';
            }
          }
        }
      }
    }
    
    // Generate invoice number from order number
    const invoiceNumber = transaction.order && transaction.order.orderNumber 
      ? `INV-${transaction.order.orderNumber}` 
      : null;
    
    return {
      ...transaction,
      type: transactionType,
      invoiceNumber: invoiceNumber
    };
  });

  // Apply type filter if provided
  if (type) {
    transactionsWithType = transactionsWithType.filter(t => t.type === type);
  }

  // Apply order number and invoice number search if provided (search in populated order data)
  // Note: If search matched in paymentId/transactionId/stripePaymentIntentId, keep the transaction
  // Only filter if search didn't match in DB fields and we need to check order/invoice number
  if (search) {
    const searchLower = search.toLowerCase();
    const isInvoiceSearch = search.toUpperCase().startsWith('INV-');
    const invoiceSearchTerm = isInvoiceSearch ? search.replace(/^INV-/i, '') : search;
    
    // Check if search term matches paymentId, transactionId, or stripePaymentIntentId
    // If it does, we should keep those transactions regardless of order number match
    transactionsWithType = transactionsWithType.filter(transaction => {
      // Check if search matches payment-related fields (already matched in DB query)
      const matchesPaymentId = transaction.paymentId && transaction.paymentId.toLowerCase().includes(searchLower);
      const matchesTransactionId = transaction.transactionId && transaction.transactionId.toLowerCase().includes(searchLower);
      const matchesStripeId = transaction.stripePaymentIntentId && transaction.stripePaymentIntentId.toLowerCase().includes(searchLower);
      
      // If it matches payment fields, keep it
      if (matchesPaymentId || matchesTransactionId || matchesStripeId) {
        return true;
      }
      
      // Otherwise, check order number and invoice number
      if (transaction.order && transaction.order.orderNumber) {
        const orderNumberLower = transaction.order.orderNumber.toLowerCase();
        const invoiceNumber = `INV-${transaction.order.orderNumber}`.toLowerCase();
        
        if (isInvoiceSearch) {
          // Search for invoice number pattern
          return invoiceNumber.includes(searchLower) || orderNumberLower.includes(invoiceSearchTerm.toLowerCase());
        } else {
          // Regular search in order number
          return orderNumberLower.includes(searchLower);
        }
      }
      
      // If no order and didn't match payment fields, exclude it
      return false;
    });
  }

  // Calculate summary statistics using the same filter
  const summary = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'success'] }, '$amount', 0]
          }
        },
        failedAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'failed'] }, '$amount', 0]
          }
        },
        refundedAmount: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'refunded'] },
              { $ifNull: ['$refundAmount', 0] },
              0
            ]
          }
        },
        successCount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0]
          }
        },
        failedCount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0]
          }
        },
        pendingCount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
          }
        },
        processingCount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'processing'] }, 1, 0]
          }
        }
      }
    }
  ]);

  const statistics = summary[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    successfulAmount: 0,
    failedAmount: 0,
    refundedAmount: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    processingCount: 0
  };
  
  // Remove _id from statistics
  delete statistics._id;

  // Recalculate total if type filter or order number search was applied (post-populate filtering)
  const actualTotal = (type || (search && transactionsWithType.length < transactions.length)) 
    ? transactionsWithType.length 
    : total;

  return {
    transactions: transactionsWithType,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total: actualTotal,
      pages: Math.ceil(actualTotal / limitNum)
    },
    statistics
  };
};

/**
 * Get transaction by ID for a patient
 * @param {string} patientId - Patient ID
 * @param {string} transactionId - Transaction/Payment ID
 * @returns {Promise<object>} Transaction details
 */
exports.getTransactionById = async (patientId, transactionId) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new AppError('Invalid transaction ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Get transaction with full details
  const transaction = await Payment.findOne({
    _id: transactionId,
    patient: patientId
  })
    .populate({
      path: 'order',
      select: 'orderNumber totalAmount subtotal shippingCharges tax discount paymentStatus orderStatus items prescription createdAt'
    })
    .populate({
      path: 'patient',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode'
      }
    })
    .lean();

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  // Add transaction type based on order items and prescription references
  let type = 'Shopping'; // Default type
  
  if (transaction.order) {
    // Check if order has a prescription reference (refill order)
    if (transaction.order.prescription) {
      type = 'Refill';
    }
    // Check if any order item has prescriptionItem reference (refill order)
    else if (transaction.order.items && transaction.order.items.length > 0) {
      const hasPrescriptionItem = transaction.order.items.some(item => item.prescriptionItem);
      
      if (hasPrescriptionItem) {
        type = 'Refill';
      } else {
        // Determine type based on product types
        const items = transaction.order.items;
        const productTypes = items.map(item => item.productType).filter(Boolean);
        
        if (productTypes.length > 0) {
          const uniqueTypes = [...new Set(productTypes)];
          
          // If all items are doctors_note, it's an Excuse
          if (uniqueTypes.length === 1 && uniqueTypes[0] === 'doctors_note') {
            type = 'Excuse';
          }
          // If all items are medication (but no prescription ref), it's still Shopping
          // (only prescription-based orders are Refill)
          else {
            type = 'Shopping';
          }
        }
      }
    }
  }
  
  // Generate invoice number from order number
  const invoiceNumber = transaction.order && transaction.order.orderNumber 
    ? `INV-${transaction.order.orderNumber}` 
    : null;
  
  return {
    ...transaction,
    type: type,
    invoiceNumber: invoiceNumber
  };
};

/**
 * Get invoice for a transaction
 * @param {string} patientId - Patient ID
 * @param {string} transactionId - Transaction/Payment ID
 * @returns {Promise<object>} Invoice details
 */
exports.getTransactionInvoice = async (patientId, transactionId) => {
  // Get transaction first
  const transaction = await exports.getTransactionById(patientId, transactionId);
  
  if (!transaction || !transaction.order) {
    throw new AppError('Transaction or order not found', 404);
  }

  const Order = require('../../models/Order.model');
  const order = await Order.findById(transaction.order._id)
    .populate('shippingAddress')
    .populate('prescription')
    .lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Determine billing address for invoice
  let invoiceBillingAddress = null;
  
  if (order.billingAddress && Object.keys(order.billingAddress).length > 0) {
    invoiceBillingAddress = order.billingAddress;
  } else if (order.billingAddressSameAsShipping !== false && order.shippingAddress) {
    invoiceBillingAddress = {
      firstName: order.shippingAddress.fullName?.split(' ')[0] || '',
      lastName: order.shippingAddress.fullName?.split(' ').slice(1).join(' ') || '',
      email: '',
      phoneNumber: order.shippingAddress.phoneNumber || '',
      streetAddress: order.shippingAddress.addressLine1 || '',
      city: order.shippingAddress.city || '',
      state: order.shippingAddress.state || '',
      zipCode: order.shippingAddress.postalCode || ''
    };
  }
  
  return {
    invoiceNumber: transaction.invoiceNumber || `INV-${order.orderNumber}`,
    transaction: {
      _id: transaction._id,
      paymentId: transaction.paymentId,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      paymentStatus: transaction.paymentStatus,
      type: transaction.type,
      createdAt: transaction.createdAt
    },
    order: {
      ...order,
      billingAddress: order.billingAddress || invoiceBillingAddress
    },
    billingAddress: invoiceBillingAddress,
    items: order.items,
    subtotal: order.subtotal,
    shippingCharges: order.shippingCharges,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt
  };
};

