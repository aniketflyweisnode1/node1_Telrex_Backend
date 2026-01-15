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
    search // Search by paymentId, transactionId, order number
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

  // Build final filter - handle search separately
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
          select: 'orderNumber totalAmount subtotal shippingCharges tax discount paymentStatus orderStatus items createdAt'
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

  return {
    transactions,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
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
      select: 'orderNumber totalAmount subtotal shippingCharges tax discount paymentStatus orderStatus items createdAt'
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

  return transaction;
};

