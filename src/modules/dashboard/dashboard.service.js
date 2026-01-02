const User = require('../../models/User.model');
const Payment = require('../../models/Payment.model');
const Order = require('../../models/Order.model');
const Prescription = require('../../models/Prescription.model');
const Chat = require('../../models/Chat.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const Address = require('../../models/Address.model');
const LoginHistory = require('../../models/LoginHistory.model');
const AppError = require('../../utils/AppError');

// Helper function to get date range
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

// Get Dashboard Data
exports.getDashboardData = async (query = {}) => {
  const {
    period = 'last_30_days',
    region, // Placeholder for future region filtering
    doctorId, // Filter by specific doctor
    medicationId // Filter by specific medication
  } = query;

  const { startDate, endDate } = getDateRange(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriod(period);

  // Build filters
  const currentFilter = { createdAt: { $gte: startDate, $lte: endDate } };
  const previousFilter = { createdAt: { $gte: prevStartDate, $lte: prevEndDate } };

  // Get today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Get current period data
  const [
    currentTotalUsers,
    currentTotalRevenue,
    currentPharmacySales,
    currentConsultationsToday,
    previousTotalUsers,
    previousTotalRevenue,
    previousPharmacySales,
    previousConsultationsToday,
    activeConsultations,
    prescriptionsIssued,
    ordersProcessing,
    completedDeliveries
  ] = await Promise.all([
    // Current period - Total Users
    User.countDocuments({ 
      role: { $in: ['patient', 'doctor'] },
      createdAt: { $lte: endDate }
    }),

    // Current period - Total Revenue (all successful payments)
    Payment.aggregate([
      {
        $match: {
          paymentStatus: 'success',
          ...currentFilter
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Current period - Pharmacy Sales (orders with medication items)
    Order.aggregate([
      {
        $match: {
          ...currentFilter,
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

    // Today - Consultations (prescriptions created today)
    Prescription.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }),

    // Previous period - Total Users
    User.countDocuments({ 
      role: { $in: ['patient', 'doctor'] },
      createdAt: { $lte: prevEndDate }
    }),

    // Previous period - Total Revenue
    Payment.aggregate([
      {
        $match: {
          paymentStatus: 'success',
          ...previousFilter
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Previous period - Pharmacy Sales
    Order.aggregate([
      {
        $match: {
          ...previousFilter,
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

    // Previous period - Consultations Today (same day last period)
    Prescription.countDocuments({
      createdAt: { 
        $gte: new Date(prevStartDate.getTime() + (todayStart.getTime() - startDate.getTime())),
        $lte: new Date(prevStartDate.getTime() + (todayEnd.getTime() - startDate.getTime()))
      }
    }),

    // Active Consultations (active chats/prescriptions)
    Chat.countDocuments({ status: 'active' }),

    // Prescriptions Issued (in current period)
    Prescription.countDocuments({ ...currentFilter }),

    // Orders Processing (orders with status processing/pending)
    Order.countDocuments({ 
      orderStatus: { $in: ['pending', 'processing', 'confirmed'] }
    }),

    // Completed Deliveries (orders with status delivered/completed)
    Order.countDocuments({ 
      orderStatus: 'delivered'
    })
  ]);

  const totalUsers = currentTotalUsers;
  const totalRevenue = currentTotalRevenue[0]?.total || 0;
  const pharmacySales = currentPharmacySales[0]?.total || 0;
  const consultationsToday = currentConsultationsToday;

  const prevTotalUsers = previousTotalUsers;
  const prevTotalRevenue = previousTotalRevenue[0]?.total || 0;
  const prevPharmacySales = previousPharmacySales[0]?.total || 0;
  const prevConsultationsToday = previousConsultationsToday;

  return {
    kpis: {
      totalUsers: {
        value: totalUsers,
        change: calculatePercentageChange(totalUsers, prevTotalUsers),
        isIncrease: totalUsers >= prevTotalUsers
      },
      totalRevenue: {
        value: totalRevenue,
        change: calculatePercentageChange(totalRevenue, prevTotalRevenue),
        isIncrease: totalRevenue >= prevTotalRevenue
      },
      pharmacySales: {
        value: pharmacySales,
        change: calculatePercentageChange(pharmacySales, prevPharmacySales),
        isIncrease: pharmacySales >= prevPharmacySales
      },
      consultationsToday: {
        value: consultationsToday,
        change: calculatePercentageChange(consultationsToday, prevConsultationsToday),
        isIncrease: consultationsToday >= prevConsultationsToday
      }
    },
    summary: {
      activeConsultations: activeConsultations,
      prescriptionsIssued: prescriptionsIssued,
      ordersProcessing: ordersProcessing,
      completedDeliveries: completedDeliveries
    }
  };
};

// Get Revenue vs Payouts Chart Data
exports.getRevenueVsPayoutsChart = async (query = {}) => {
  const { year = new Date().getFullYear() } = query;
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

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

  // Get monthly payouts data
  const monthlyPayouts = await DoctorPayout.aggregate([
    {
      $match: {
        status: 'completed',
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
  const chartData = months.map((month, index) => {
    const monthNumber = index + 1;
    const revenueData = monthlyRevenue.find(m => m._id === monthNumber);
    const payoutData = monthlyPayouts.find(m => m._id === monthNumber);
    
    return {
      month,
      monthNumber,
      revenue: revenueData ? revenueData.total : 0,
      payouts: payoutData ? payoutData.total : 0
    };
  });

  // Calculate total and percentage change from previous year
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalPayouts = chartData.reduce((sum, item) => sum + item.payouts, 0);
  const netAmount = totalRevenue - totalPayouts;

  // Get previous year data for comparison
  const prevYearStart = new Date(year - 1, 0, 1);
  const prevYearEnd = new Date(year - 1, 11, 31, 23, 59, 59);

  const prevYearRevenue = await Payment.aggregate([
    {
      $match: {
        paymentStatus: 'success',
        createdAt: { $gte: prevYearStart, $lte: prevYearEnd }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const prevYearNet = prevYearRevenue[0]?.total || 0;
  const percentageChange = calculatePercentageChange(netAmount, prevYearNet);

  return {
    year: parseInt(year),
    total: netAmount,
    percentageChange: percentageChange,
    isIncrease: netAmount >= prevYearNet,
    data: chartData
  };
};

// Get AI Insights
exports.getAIInsights = async () => {
  // Get pending payouts count and percentage
  const totalPayouts = await DoctorPayout.countDocuments();
  const pendingPayouts = await DoctorPayout.countDocuments({ 
    status: { $in: ['pending', 'processing'] }
  });
  const pendingPercentage = totalPayouts > 0 ? Math.round((pendingPayouts / totalPayouts) * 100) : 0;

  // Get latest pending payout batch
  const latestPendingPayout = await DoctorPayout.findOne({ 
    status: { $in: ['pending', 'processing'] }
  }).sort({ createdAt: -1 }).lean();

  // Get medication demand trends (placeholder - implement based on order data)
  const recentOrders = await Order.find({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    paymentStatus: 'paid'
  })
    .populate('items')
    .limit(100)
    .lean();

  // Analyze medication demand (simplified - count medication orders)
  const medicationOrders = recentOrders.filter(order => 
    order.items?.some(item => item.productType === 'medication')
  ).length;

  const insights = [];

  // Insight 1: Pending Payouts Alert
  if (pendingPercentage >= 30) {
    insights.push({
      type: 'recommendation',
      title: 'Recommendation',
      message: `${pendingPercentage}% of Doctor Payouts are pending approval. ${latestPendingPayout ? `Review Batch #${latestPendingPayout.payoutId.slice(-3)} to avoid delays.` : 'Review pending payouts to avoid delays.'}`,
      priority: 'high'
    });
  }

  // Insight 2: Medication Demand (placeholder)
  if (medicationOrders > 50) {
    insights.push({
      type: 'trend_alert',
      title: 'Trend Alerts',
      message: `Medication demand is up ${Math.round((medicationOrders / 50) * 100 - 100)}% compared to average. Consider restocking popular items.`,
      priority: 'medium'
    });
  }

  // Insight 3: Revenue Growth (if applicable)
  const lastWeekRevenue = await Payment.aggregate([
    {
      $match: {
        paymentStatus: 'success',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const previousWeekRevenue = await Payment.aggregate([
    {
      $match: {
        paymentStatus: 'success',
        createdAt: { 
          $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const currentWeekRevenue = lastWeekRevenue[0]?.total || 0;
  const prevWeekRevenue = previousWeekRevenue[0]?.total || 0;
  const revenueChange = calculatePercentageChange(currentWeekRevenue, prevWeekRevenue);

  if (Math.abs(revenueChange) > 10) {
    insights.push({
      type: 'trend_alert',
      title: 'Trend Alerts',
      message: `Revenue has ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% compared to last week.`,
      priority: revenueChange > 0 ? 'low' : 'high'
    });
  }

  // If no insights, return default insights
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'System Status',
      message: 'All systems operating normally. No critical alerts at this time.',
      priority: 'low'
    });
  }

  return {
    insights: insights.slice(0, 3) // Return max 3 insights
  };
};

// Get Recent Activity
exports.getRecentActivity = async (query = {}) => {
  const { limit = 10 } = query;

  const activities = [];

  // Get recent prescriptions (consultation bookings)
  const recentPrescriptions = await Prescription.find()
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email role'
      }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: 'firstName lastName email role'
      }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) * 2)
    .lean();

  recentPrescriptions.forEach(prescription => {
    activities.push({
      userDoctor: prescription.patient?.user
        ? `${prescription.patient.user.firstName} ${prescription.patient.user.lastName} (Patient)`
        : 'N/A',
      userDoctorId: prescription.patient?._id,
      userDoctorRole: 'patient',
      action: 'New Consultation Booking',
      status: prescription.status === 'active' ? 'pending' : prescription.status === 'completed' ? 'completed' : 'pending',
      time: prescription.createdAt,
      _source: 'prescription',
      _id: prescription._id
    });
  });

  // Get recent payouts (payout batches)
  const recentPayouts = await DoctorPayout.find()
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email role'
      }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) * 2)
    .lean();

  recentPayouts.forEach(payout => {
    activities.push({
      userDoctor: payout.doctor?.user
        ? `Dr. ${payout.doctor.user.firstName} ${payout.doctor.user.lastName}`
        : 'N/A',
      userDoctorId: payout.doctor?._id,
      userDoctorRole: 'doctor',
      action: `Payout Batch #${payout.payoutId.slice(-3)}`,
      status: payout.status === 'completed' ? 'completed' : payout.status === 'pending' ? 'pending' : 'processing',
      time: payout.createdAt,
      _source: 'payout',
      _id: payout._id
    });
  });

  // Get recent successful logins (for admin visibility)
  const recentLogins = await LoginHistory.find({
    status: 'success',
    loginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  })
    .populate({
      path: 'user',
      select: 'firstName lastName email role'
    })
    .sort({ loginAt: -1 })
    .limit(parseInt(limit) * 2)
    .lean();

  recentLogins.forEach(login => {
    if (login.user) {
      activities.push({
        userDoctor: login.user.role === 'doctor'
          ? `Dr. ${login.user.firstName} ${login.user.lastName}`
          : `${login.user.firstName} ${login.user.lastName} (Patient)`,
        userDoctorId: login.user._id,
        userDoctorRole: login.user.role,
        action: 'User Login',
        status: 'completed',
        time: login.loginAt,
        _source: 'login',
        _id: login._id
      });
    }
  });

  // Sort by time (newest first) and limit
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  const limitedActivities = activities.slice(0, parseInt(limit));

  // Format time as "X mins ago", "X hours ago", etc.
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return new Date(date).toLocaleDateString();
  };

  return {
    activities: limitedActivities.map(activity => ({
      userDoctor: activity.userDoctor,
      action: activity.action,
      status: activity.status,
      time: activity.time,
      timeAgo: formatTimeAgo(activity.time)
    }))
  };
};

// Get Prescriptions By Region
exports.getPrescriptionsByRegion = async (query = {}) => {
  const { period = 'last_30_days' } = query;

  const { startDate, endDate } = getDateRange(period);

  // Get prescriptions
  const prescriptions = await Prescription.find({
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .populate({
      path: 'patient',
      select: '_id'
    })
    .select('patient createdAt')
    .lean();

  // Group by state/region using patient addresses
  const regionMap = {};

  for (const prescription of prescriptions) {
    if (!prescription.patient) continue;

    // Get patient's default address or first address
    const address = await Address.findOne({ 
      patient: prescription.patient._id,
      isDefault: true
    }) || await Address.findOne({ 
      patient: prescription.patient._id
    }).sort({ createdAt: 1 });

    const state = address?.state || 'Unknown';
    const region = state; // Using state as region for now

    if (!regionMap[region]) {
      regionMap[region] = {
        region: region,
        state: state,
        count: 0,
        percentage: 0
      };
    }
    regionMap[region].count++;
  }

  // Calculate percentages
  const total = prescriptions.length;
  const regionData = Object.values(regionMap).map(region => ({
    ...region,
    percentage: total > 0 ? Math.round((region.count / total) * 100) : 0
  }));

  // Sort by count (descending)
  regionData.sort((a, b) => b.count - a.count);

  // Find region with highest activity
  const highActivityRegion = regionData.length > 0 ? regionData[0] : null;

  return {
    regions: regionData,
    highActivity: highActivityRegion ? {
      region: highActivityRegion.region,
      count: highActivityRegion.count,
      percentage: highActivityRegion.percentage
    } : null,
    total: total,
    period: period
  };
};

