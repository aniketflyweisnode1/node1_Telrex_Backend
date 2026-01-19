const Payment = require('../../models/Payment.model');
const Order = require('../../models/Order.model');
const Prescription = require('../../models/Prescription.model');
const Doctor = require('../../models/Doctor.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const AppError = require('../../utils/AppError');

// Helper function to get date range for period
const getDateRange = (period = 'last_30_days') => {
  const now = new Date();
  let startDate, endDate = new Date(now);

  switch (period) {
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'last_90_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'last_365_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 365);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
};

// Helper function to get previous period for comparison
const getPreviousPeriod = (period = 'last_30_days') => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'last_7_days':
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 7);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_30_days':
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 30);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'last_90_days':
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 90);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'last_365_days':
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 365);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 365);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    default:
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 30);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
};

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Get financial overview summary
exports.getFinancialOverview = async (period = 'last_30_days') => {
  const { startDate, endDate } = getDateRange(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriod(period);

  // Get current period data
  const [
    currentTotalRevenue,
    currentConsultationFees,
    currentMedicineSales,
    currentPendingPayouts,
    previousTotalRevenue,
    previousConsultationFees,
    previousMedicineSales,
    previousPendingPayouts
  ] = await Promise.all([
    // Current period - Total Revenue (all successful payments)
    Payment.aggregate([
      {
        $match: {
          paymentStatus: 'success',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Current period - Consultation Fees (sum of doctor consultation fees from prescriptions)
    Prescription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      { $unwind: '$doctorInfo' },
      {
        $group: {
          _id: null,
          total: { $sum: '$doctorInfo.consultationFee' }
        }
      }
    ]),

    // Current period - Medicine Sales (orders with medication items)
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.productType': 'medication'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$items.totalPrice' }
        }
      }
    ]),

    // Current period - Pending Payouts (count of doctors with pending payouts)
    // This is a placeholder - implement based on your payout system
    Doctor.countDocuments({ status: 'active' }),

    // Previous period - Total Revenue
    Payment.aggregate([
      {
        $match: {
          paymentStatus: 'success',
          createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Previous period - Consultation Fees
    Prescription.aggregate([
      {
        $match: {
          createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      { $unwind: '$doctorInfo' },
      {
        $group: {
          _id: null,
          total: { $sum: '$doctorInfo.consultationFee' }
        }
      }
    ]),

    // Previous period - Medicine Sales
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: prevStartDate, $lte: prevEndDate },
          paymentStatus: 'paid'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.productType': 'medication'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$items.totalPrice' }
        }
      }
    ]),

    // Previous period - Pending Payouts
    Doctor.countDocuments({ status: 'active' })
  ]);

  const totalRevenue = currentTotalRevenue[0]?.total || 0;
  const consultationFees = currentConsultationFees[0]?.total || 0;
  const medicineSales = currentMedicineSales[0]?.total || 0;
  const pendingPayouts = currentPendingPayouts;

  const prevTotalRevenue = previousTotalRevenue[0]?.total || 0;
  const prevConsultationFees = previousConsultationFees[0]?.total || 0;
  const prevMedicineSales = previousMedicineSales[0]?.total || 0;
  const prevPendingPayouts = previousPendingPayouts;

  return {
    totalRevenue: {
      amount: totalRevenue,
      change: calculatePercentageChange(totalRevenue, prevTotalRevenue),
      isIncrease: totalRevenue >= prevTotalRevenue
    },
    consultationFees: {
      amount: consultationFees,
      change: calculatePercentageChange(consultationFees, prevConsultationFees),
      isIncrease: consultationFees >= prevConsultationFees
    },
    medicineSales: {
      amount: medicineSales,
      change: calculatePercentageChange(medicineSales, prevMedicineSales),
      isIncrease: medicineSales >= prevMedicineSales
    },
    pendingPayouts: {
      count: pendingPayouts,
      change: calculatePercentageChange(pendingPayouts, prevPendingPayouts),
      isIncrease: pendingPayouts >= prevPendingPayouts
    }
  };
};

// Get revenue chart data (monthly revenue for a year)
exports.getRevenueChart = async (year = null) => {
  // Validate year parameter
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  
  // Validate year range (2020-2100)
  if (currentYear < 2020 || currentYear > 2100) {
    throw new AppError('Year must be between 2020 and 2100', 400);
  }

  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

  // Get available years (years that have payment data)
  const availableYears = await Payment.aggregate([
    {
      $match: {
        paymentStatus: 'success'
      }
    },
    {
      $group: {
        _id: { $year: '$createdAt' }
      }
    },
    {
      $sort: { '_id': -1 } // Sort descending (newest first)
    },
    {
      $project: {
        _id: 0,
        year: '$_id'
      }
    }
  ]);

  // Get monthly revenue data for the selected year
  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        paymentStatus: 'success',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  // Create array for all 12 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = months.map((month, index) => {
    const monthData = monthlyRevenue.find(m => m._id === index + 1);
    return {
      month,
      monthNumber: index + 1,
      revenue: monthData ? monthData.total : 0
    };
  });

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);

  return {
    year: currentYear,
    data: revenueData,
    total: totalRevenue,
    availableYears: availableYears.map(y => y.year).sort((a, b) => b - a) // Sorted descending (newest first)
  };
};

// Helper function to format date as "2025-01-15, 3:30:00 PM"
const formatTransactionDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');
  return `${year}-${month}-${day}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
};

// Helper function to format payment method
const formatPaymentMethod = (method) => {
  const methodMap = {
    'card': 'Credit Card',
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'netbanking': 'Net Banking',
    'net_banking': 'Net Banking',
    'upi': 'UPI',
    'wallet': 'Wallet',
    'bank_transfer': 'Net Banking',
    'wire_transfer': 'Wire Transfer',
    'ach': 'ACH',
    'check': 'Check',
    'consultation': 'Credit Card' // Default for consultations
  };
  return methodMap[method?.toLowerCase()] || method || 'Credit Card';
};

// Helper function to format transaction ID (TX-001 RX-12345 format)
const formatTransactionId = (id, type, prescriptionNumber = null) => {
  // Generate TX-XXX prefix based on id
  const txNumber = String(id).slice(-3).padStart(3, '0');
  const rxPart = prescriptionNumber || `RX-${String(id).slice(-5)}`;
  return `TX-${txNumber} ${rxPart}`;
};

// Get recent transactions with filtering
exports.getRecentTransactions = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    type, // 'all', 'consultation', 'pharmacy', 'payouts'
    startDate,
    endDate,
    year // Year filter (e.g., 2024, 2025)
  } = query;

  const dateFilter = {};

  // Year filter takes precedence over startDate/endDate
  if (year) {
    const selectedYear = parseInt(year);
    if (selectedYear >= 2020 && selectedYear <= 2100) {
      const startOfYear = new Date(selectedYear, 0, 1);
      const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);
      dateFilter.createdAt = { $gte: startOfYear, $lte: endOfYear };
    }
  } else if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  let transactions = [];

  // Get payments (for pharmacy/medicine sales)
  if (!type || type === 'all' || type === 'pharmacy') {
    const payments = await Payment.find({
      ...dateFilter
    })
      .populate({
        path: 'order',
        select: 'orderNumber patient',
        populate: {
          path: 'patient',
          select: 'user',
          populate: {
            path: 'user',
            select: 'firstName lastName email profilePicture'
          }
        }
      })
      .populate({
        path: 'patient',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName email profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 3)
      .lean();

    payments.forEach((payment, index) => {
      const user = payment.order?.patient?.user || payment.patient?.user;
      if (user) {
        transactions.push({
          transactionId: formatTransactionId(payment._id, 'pharmacy', payment.order?.orderNumber),
          type: 'Pharmacy',
          doctorPharmacy: {
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName} Pharmacy` 
              : (user.firstName || user.lastName || 'Pharmacy'),
            email: user.email || '',
            profilePicture: user.profilePicture || null
          },
          amount: payment.amount,
          formattedAmount: `+$${payment.amount.toFixed(2)}`,
          paymentMethod: formatPaymentMethod(payment.paymentMethod),
          date: payment.createdAt,
          formattedDate: formatTransactionDate(payment.createdAt),
          status: payment.paymentStatus === 'success' ? 'Success' : 
                  payment.paymentStatus === 'pending' || payment.paymentStatus === 'processing' ? 'Pending' : 'Failed',
          paymentStatus: payment.paymentStatus,
          orderNumber: payment.order?.orderNumber,
          _source: 'payment',
          _sortIndex: index
        });
      }
    });
  }

  // Get prescriptions (for consultations)
  if (!type || type === 'all' || type === 'consultation') {
    const prescriptions = await Prescription.find({
      ...dateFilter
    })
      .populate({
        path: 'doctor',
        select: 'user consultationFee',
        populate: {
          path: 'user',
          select: 'firstName lastName email profilePicture'
        }
      })
      .populate({
        path: 'patient',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 3)
      .lean();

    prescriptions.forEach((prescription, index) => {
      if (prescription.doctor && prescription.doctor.user) {
        transactions.push({
          transactionId: formatTransactionId(prescription._id, 'consultation', prescription.prescriptionNumber),
          type: 'Consultation',
          doctorPharmacy: {
            name: prescription.doctor.user.firstName && prescription.doctor.user.lastName
              ? `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`
              : 'N/A',
            email: prescription.doctor.user.email || '',
            profilePicture: prescription.doctor.user.profilePicture || null
          },
          amount: prescription.doctor.consultationFee || 0,
          formattedAmount: `+$${(prescription.doctor.consultationFee || 0).toFixed(2)}`,
          paymentMethod: formatPaymentMethod('consultation'),
          date: prescription.createdAt,
          formattedDate: formatTransactionDate(prescription.createdAt),
          status: 'Success', // Consultations are considered successful when created
          paymentStatus: 'success',
          prescriptionNumber: prescription.prescriptionNumber,
          _source: 'prescription',
          _sortIndex: index
        });
      }
    });
  }

  // Get payouts (for doctor payouts)
  if (!type || type === 'all' || type === 'payouts') {
    const payouts = await DoctorPayout.find({
      ...dateFilter
    })
      .populate({
        path: 'doctor',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName email profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 3)
      .lean();

    payouts.forEach((payout, index) => {
      if (payout.doctor && payout.doctor.user) {
        const statusMap = {
          'completed': 'Success',
          'pending': 'Pending',
          'processing': 'Pending',
          'failed': 'Failed',
          'cancelled': 'Failed'
        };

        transactions.push({
          transactionId: formatTransactionId(payout._id, 'payout', payout.payoutId),
          type: 'Payout',
          doctorPharmacy: {
            name: payout.doctor.user.firstName && payout.doctor.user.lastName
              ? `Dr. ${payout.doctor.user.firstName} ${payout.doctor.user.lastName}`
              : 'N/A',
            email: payout.doctor.user.email || '',
            profilePicture: payout.doctor.user.profilePicture || null
          },
          amount: payout.amount,
          formattedAmount: `+$${payout.amount.toFixed(2)}`,
          paymentMethod: formatPaymentMethod(payout.payoutMethod),
          date: payout.createdAt,
          formattedDate: formatTransactionDate(payout.createdAt),
          status: statusMap[payout.status] || 'Pending',
          paymentStatus: payout.status,
          payoutId: payout.payoutId,
          _source: 'payout',
          _sortIndex: index
        });
      }
    });
  }

  // Get available years (years that have transaction data)
  const availableYears = await Promise.all([
    Payment.distinct('createdAt', { paymentStatus: { $in: ['success', 'pending', 'failed'] } }),
    Prescription.distinct('createdAt'),
    DoctorPayout.distinct('createdAt')
  ]);

  // Combine all dates and extract unique years
  const allDates = [
    ...availableYears[0].map(d => new Date(d).getFullYear()),
    ...availableYears[1].map(d => new Date(d).getFullYear()),
    ...availableYears[2].map(d => new Date(d).getFullYear())
  ];
  const uniqueYears = [...new Set(allDates)].filter(y => y >= 2020 && y <= 2100).sort((a, b) => b - a);

  // Sort by date (newest first) and paginate
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

  // Get counts by type (before pagination)
  const allCount = transactions.length;
  const consultationCount = transactions.filter(t => t.type === 'Consultation').length;
  const pharmacyCount = transactions.filter(t => t.type === 'Pharmacy').length;
  const payoutsCount = transactions.filter(t => t.type === 'Payout').length;

  // Format transactions for response (remove internal fields)
  const formattedTransactions = paginatedTransactions.map(t => {
    const { _source, _sortIndex, ...transaction } = t;
    // Return transaction with all formatted fields
    return {
      transactionId: transaction.transactionId,
      type: transaction.type,
      doctorPharmacy: transaction.doctorPharmacy,
      amount: transaction.amount,
      formattedAmount: transaction.formattedAmount,
      paymentMethod: transaction.paymentMethod,
      date: transaction.date,
      formattedDate: transaction.formattedDate,
      status: transaction.status,
      // Include additional fields if needed
      ...(transaction.prescriptionNumber && { prescriptionNumber: transaction.prescriptionNumber }),
      ...(transaction.orderNumber && { orderNumber: transaction.orderNumber }),
      ...(transaction.payoutId && { payoutId: transaction.payoutId })
    };
  });

  return {
    transactions: formattedTransactions,
    counts: {
      all: allCount,
      consultation: consultationCount,
      pharmacy: pharmacyCount,
      payouts: payoutsCount
    },
    availableYears: uniqueYears,
    year: year ? parseInt(year) : null,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: transactions.length,
      pages: Math.ceil(transactions.length / parseInt(limit))
    }
  };
};

