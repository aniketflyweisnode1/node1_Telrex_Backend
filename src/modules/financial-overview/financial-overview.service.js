const Payment = require('../../models/Payment.model');
const Order = require('../../models/Order.model');
const Prescription = require('../../models/Prescription.model');
const Doctor = require('../../models/Doctor.model');
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
  const currentYear = year || new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

  // Get monthly revenue data
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

  return {
    year: currentYear,
    data: revenueData,
    total: revenueData.reduce((sum, item) => sum + item.revenue, 0)
  };
};

// Get recent transactions with filtering
exports.getRecentTransactions = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    type, // 'all', 'consultation', 'pharmacy', 'payouts'
    startDate,
    endDate
  } = query;

  const dateFilter = {};

  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  let transactions = [];

  // Get payments (for pharmacy/medicine sales)
  if (!type || type === 'all' || type === 'pharmacy') {
    const payments = await Payment.find({
      paymentStatus: 'success',
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
            select: 'firstName lastName email'
          }
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

    payments.forEach(payment => {
      if (payment.order && payment.order.patient) {
        const patient = payment.order.patient;
        transactions.push({
          transactionId: payment.paymentId || `PAY-${payment._id.toString().slice(-8)}`,
          type: 'Pharmacy',
          doctorPharmacy: patient.user
            ? `${patient.user.firstName} ${patient.user.lastName}`
            : 'N/A',
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          date: payment.createdAt,
          orderNumber: payment.order.orderNumber,
          _source: 'payment'
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
          select: 'firstName lastName'
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

    prescriptions.forEach(prescription => {
      if (prescription.doctor && prescription.doctor.user) {
        transactions.push({
          transactionId: prescription.prescriptionNumber,
          type: 'Consultation',
          doctorPharmacy: prescription.doctor.user
            ? `Dr. ${prescription.doctor.user.firstName} ${prescription.doctor.user.lastName}`
            : 'N/A',
          amount: prescription.doctor.consultationFee || 0,
          paymentMethod: 'consultation',
          date: prescription.createdAt,
          prescriptionNumber: prescription.prescriptionNumber,
          _source: 'prescription'
        });
      }
    });
  }

  // Sort by date (newest first) and paginate
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

  // Get counts by type
  const allCount = transactions.length;
  const consultationCount = transactions.filter(t => t.type === 'Consultation').length;
  const pharmacyCount = transactions.filter(t => t.type === 'Pharmacy').length;
  const payoutsCount = 0; // Placeholder - implement based on payout system

  return {
    transactions: paginatedTransactions.map(t => {
      const { _source, ...transaction } = t;
      return transaction;
    }),
    counts: {
      all: allCount,
      consultation: consultationCount,
      pharmacy: pharmacyCount,
      payouts: payoutsCount
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: transactions.length,
      pages: Math.ceil(transactions.length / parseInt(limit))
    }
  };
};

