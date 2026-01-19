const User = require('../../models/User.model');
const Payment = require('../../models/Payment.model');
const Order = require('../../models/Order.model');
const Prescription = require('../../models/Prescription.model');
const Chat = require('../../models/Chat.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const Address = require('../../models/Address.model');
const LoginHistory = require('../../models/LoginHistory.model');
const Doctor = require('../../models/Doctor.model');
const Medicine = require('../../models/Medicine.model');
const Patient = require('../../models/Patient.model');
const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');

// Helper function to get date range
const getDateRange = (period = 'last_30_days') => {
  const now = new Date();
  let startDate, endDate = new Date(now);

  switch (period) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
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
    case 'today':
      // Previous day
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setHours(0, 0, 0, 0);
      break;
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

// Helper function to build patient filter based on region
const buildPatientFilterByRegion = async (region) => {
  if (!region) return {};
  
  // Find patients with addresses in the specified region/state
  const addresses = await Address.find({ state: region }).select('patient').lean();
  const patientIds = [...new Set(addresses.map(addr => addr.patient.toString()))];
  
  if (patientIds.length === 0) {
    // Return a filter that matches nothing
    return { _id: { $in: [] } };
  }
  
  return { _id: { $in: patientIds.map(id => new mongoose.Types.ObjectId(id)) } };
};

// Helper function to build doctor filter based on region
const buildDoctorFilterByRegion = async (region) => {
  if (!region) return {};
  
  // Find doctors with addresses in the specified region/state
  const doctors = await Doctor.find({ 'address.state': region }).select('_id').lean();
  const doctorIds = doctors.map(doc => doc._id);
  
  if (doctorIds.length === 0) {
    return { _id: { $in: [] } };
  }
  
  return { _id: { $in: doctorIds } };
};

// Get Dashboard Data
exports.getDashboardData = async (query = {}) => {
  const {
    period = 'last_30_days',
    region, // Filter by region/state
    doctorId, // Filter by specific doctor
    medicationId // Filter by specific medication
  } = query;

  const { startDate, endDate } = getDateRange(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriod(period);

  // Build base filters
  const currentFilter = { createdAt: { $gte: startDate, $lte: endDate } };
  const previousFilter = { createdAt: { $gte: prevStartDate, $lte: prevEndDate } };

  // Build region-based filters
  let patientFilter = {};
  let doctorFilter = {};
  if (region && region !== 'all' && region !== '') {
    patientFilter = await buildPatientFilterByRegion(region);
    doctorFilter = await buildDoctorFilterByRegion(region);
  }

  // Build doctor filter
  let prescriptionDoctorFilter = {};
  let chatDoctorFilter = {};
  if (doctorId && doctorId !== 'all' && doctorId !== '' && mongoose.Types.ObjectId.isValid(doctorId)) {
    const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
    prescriptionDoctorFilter = { doctor: doctorObjectId };
    chatDoctorFilter = { doctor: doctorObjectId };
  }

  // Build medication filter for orders
  let medicationOrderFilter = {};
  if (medicationId && medicationId !== 'all' && medicationId !== '' && mongoose.Types.ObjectId.isValid(medicationId)) {
    medicationOrderFilter = {
      'items.productId': new mongoose.Types.ObjectId(medicationId),
      'items.productType': 'medication'
    };
  }

  // Get today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Build user filter for region
  let userFilter = {};
  if (region && region !== 'all' && region !== '') {
    // Get user IDs from patients and doctors in the region
    const patients = await Patient.find(patientFilter).select('user').lean();
    const doctors = await Doctor.find(doctorFilter).select('user').lean();
    const userIds = [
      ...patients.map(p => p.user?.toString()).filter(Boolean),
      ...doctors.map(d => d.user?.toString()).filter(Boolean)
    ];
    if (userIds.length > 0) {
      userFilter = { _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } };
    } else {
      userFilter = { _id: { $in: [] } };
    }
  }

  // Build payment filter (filter by patient region)
  let paymentFilter = {};
  if (region && region !== 'all' && region !== '') {
    const patients = await Patient.find(patientFilter).select('_id').lean();
    const patientIds = patients.map(p => p._id);
    if (patientIds.length > 0) {
      paymentFilter = { patient: { $in: patientIds } };
    } else {
      paymentFilter = { patient: { $in: [] } };
    }
  }

  // Build order filter (filter by patient region and medication)
  let orderBaseFilter = {};
  if (region && region !== 'all' && region !== '') {
    const patients = await Patient.find(patientFilter).select('_id').lean();
    const patientIds = patients.map(p => p._id);
    if (patientIds.length > 0) {
      orderBaseFilter = { patient: { $in: patientIds } };
    } else {
      orderBaseFilter = { patient: { $in: [] } };
    }
  }

  // Build prescription filter (filter by patient region and doctor)
  let prescriptionBaseFilter = {};
  if ((region && region !== 'all' && region !== '') || (doctorId && doctorId !== 'all' && doctorId !== '')) {
    if (region && region !== 'all' && region !== '') {
      const patients = await Patient.find(patientFilter).select('_id').lean();
      const patientIds = patients.map(p => p._id);
      if (patientIds.length > 0) {
        prescriptionBaseFilter = { patient: { $in: patientIds } };
      } else {
        prescriptionBaseFilter = { patient: { $in: [] } };
      }
    }
    if (doctorId && doctorId !== 'all' && doctorId !== '' && mongoose.Types.ObjectId.isValid(doctorId)) {
      prescriptionBaseFilter = { ...prescriptionBaseFilter, ...prescriptionDoctorFilter };
    }
  }

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
    // Current period - Total Users (filtered by region)
    User.countDocuments({ 
      role: { $in: ['patient', 'doctor'] },
      createdAt: { $lte: endDate },
      ...userFilter
    }),

    // Current period - Total Revenue (filtered by region)
    Payment.aggregate([
      {
        $match: {
          paymentStatus: 'success',
          ...currentFilter,
          ...paymentFilter
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Current period - Pharmacy Sales (filtered by region and medication)
    Order.aggregate([
      {
        $match: {
          ...currentFilter,
          ...orderBaseFilter,
          paymentStatus: 'paid',
          ...(Object.keys(medicationOrderFilter).length > 0 ? {} : {})
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.productType': 'medication',
          ...(Object.keys(medicationOrderFilter).length > 0 ? medicationOrderFilter : {})
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$items.totalPrice' }
        }
      }
    ]),

    // Today - Consultations (filtered by region and doctor)
    Prescription.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      ...prescriptionBaseFilter
    }),

    // Previous period - Total Users (filtered by region)
    User.countDocuments({ 
      role: { $in: ['patient', 'doctor'] },
      createdAt: { $lte: prevEndDate },
      ...userFilter
    }),

    // Previous period - Total Revenue (filtered by region)
    Payment.aggregate([
      {
        $match: {
          paymentStatus: 'success',
          ...previousFilter,
          ...paymentFilter
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    // Previous period - Pharmacy Sales (filtered by region and medication)
    Order.aggregate([
      {
        $match: {
          ...previousFilter,
          ...orderBaseFilter,
          paymentStatus: 'paid',
          ...(Object.keys(medicationOrderFilter).length > 0 ? {} : {})
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.productType': 'medication',
          ...(Object.keys(medicationOrderFilter).length > 0 ? medicationOrderFilter : {})
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$items.totalPrice' }
        }
      }
    ]),

    // Previous period - Consultations Today (filtered by region and doctor)
    Prescription.countDocuments({
      createdAt: { 
        $gte: new Date(prevStartDate.getTime() + (todayStart.getTime() - startDate.getTime())),
        $lte: new Date(prevStartDate.getTime() + (todayEnd.getTime() - startDate.getTime()))
      },
      ...prescriptionBaseFilter
    }),

    // Active Consultations (filtered by doctor)
    Chat.countDocuments({ 
      status: 'active',
      ...chatDoctorFilter
    }),

    // Prescriptions Issued (filtered by region and doctor)
    Prescription.countDocuments({ 
      ...currentFilter,
      ...prescriptionBaseFilter
    }),

    // Orders Processing (filtered by region and medication)
    Order.countDocuments({ 
      orderStatus: { $in: ['pending', 'processing', 'confirmed'] },
      ...orderBaseFilter,
      ...(Object.keys(medicationOrderFilter).length > 0 ? {
        items: { $elemMatch: medicationOrderFilter }
      } : {})
    }),

    // Completed Deliveries (filtered by region and medication)
    Order.countDocuments({ 
      orderStatus: 'delivered',
      ...orderBaseFilter,
      ...(Object.keys(medicationOrderFilter).length > 0 ? {
        items: { $elemMatch: medicationOrderFilter }
      } : {})
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

  // Build consultation filter for region
  let consultationPatientFilter = {};
  if (region && region !== 'all' && region !== '') {
    const consultationPatients = await Patient.find(patientFilter).select('_id').lean();
    const consultationPatientIds = consultationPatients.map(p => p._id);
    if (consultationPatientIds.length > 0) {
      consultationPatientFilter = { patient: { $in: consultationPatientIds } };
    } else {
      consultationPatientFilter = { patient: { $in: [] } };
    }
  }

  // Get all list data with filters applied
  const { page = 1, limit = 50 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [
    allPrescriptions,
    allPrescriptionsCount,
    allOrders,
    allOrdersCount,
    allConsultations,
    allConsultationsCount,
    allUsers,
    allUsersCount,
    allPayments,
    allPaymentsCount
  ] = await Promise.all([
    // All Prescriptions (filtered)
    Prescription.find({
      ...currentFilter,
      ...prescriptionBaseFilter
    })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),

    // Prescriptions Count
    Prescription.countDocuments({
      ...currentFilter,
      ...prescriptionBaseFilter
    }),

    // All Orders (filtered)
    Order.find({
      ...currentFilter,
      ...orderBaseFilter,
      ...(Object.keys(medicationOrderFilter).length > 0 ? {
        items: { $elemMatch: medicationOrderFilter }
      } : {})
    })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .populate('shippingAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),

    // Orders Count
    Order.countDocuments({
      ...currentFilter,
      ...orderBaseFilter,
      ...(Object.keys(medicationOrderFilter).length > 0 ? {
        items: { $elemMatch: medicationOrderFilter }
      } : {})
    }),

    // All Consultations (filtered)
    Chat.find({
      ...chatDoctorFilter,
      ...consultationPatientFilter
    })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),

    // Consultations Count
    Chat.countDocuments({
      ...chatDoctorFilter,
      ...consultationPatientFilter
    }),

    // All Users (filtered by region)
    User.find({
      role: { $in: ['patient', 'doctor'] },
      ...userFilter
    })
      .select('firstName lastName email phoneNumber role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),

    // Users Count
    User.countDocuments({
      role: { $in: ['patient', 'doctor'] },
      ...userFilter
    }),

    // All Payments (filtered)
    Payment.find({
      ...currentFilter,
      ...paymentFilter
    })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phoneNumber'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),

    // Payments Count
    Payment.countDocuments({
      ...currentFilter,
      ...paymentFilter
    })
  ]);

  // Get filter option lists (regions, doctors, medications)
  const [regionsList, doctorsList, medicationsList] = await Promise.all([
    // Get unique regions/states from addresses
    (async () => {
      const patientStates = await Address.distinct('state', { state: { $exists: true, $ne: null, $ne: '' } });
      const doctorStates = await Doctor.distinct('address.state', { 'address.state': { $exists: true, $ne: null, $ne: '' } });
      const allStates = [...new Set([...patientStates, ...doctorStates])]
        .sort()
        .map(state => ({ id: state, name: state }));
      return allStates;
    })(),

    // Get all active doctors
    Doctor.find({ isActive: true, status: 'active' })
      .populate('user', 'firstName lastName email')
      .populate('specialty', 'name')
      .select('user specialty consultationFee rating status')
      .sort({ createdAt: -1 })
      .lean()
      .then(docs => docs.map(doc => ({
        _id: doc._id,
        name: doc.user ? `${doc.user.firstName} ${doc.user.lastName}` : 'Unknown',
        email: doc.user?.email,
        specialty: doc.specialty?.name || 'N/A',
        consultationFee: doc.consultationFee,
        rating: doc.rating?.average || 0,
        status: doc.status
      }))),

    // Get all active medications/medicines
    Medicine.find({ isActive: true })
      .select('productName brand category salePrice originalPrice status images')
      .sort({ productName: 1 })
      .lean()
      .then(meds => meds.map(med => ({
        _id: med._id,
        name: med.productName,
        brand: med.brand,
        category: med.category,
        salePrice: med.salePrice,
        originalPrice: med.originalPrice,
        status: med.status,
        image: med.images?.gallery?.[0] || med.images?.thumbnail || null
      })))
  ]);

  // Format all list data
  const listData = {
    prescriptions: {
      data: allPrescriptions.map(p => ({
        _id: p._id,
        prescriptionNumber: p.prescriptionNumber,
        patient: p.patient?.user ? {
          _id: p.patient._id,
          name: `${p.patient.user.firstName} ${p.patient.user.lastName}`,
          email: p.patient.user.email,
          phoneNumber: p.patient.user.phoneNumber
        } : null,
        doctor: p.doctor?.user ? {
          _id: p.doctor._id,
          name: `Dr. ${p.doctor.user.firstName} ${p.doctor.user.lastName}`,
          email: p.doctor.user.email,
          phoneNumber: p.doctor.user.phoneNumber
        } : null,
        medicine: p.medicine,
        brand: p.brand,
        description: p.description,
        status: p.status,
        pdfUrl: p.pdfUrl,
        isOrdered: p.isOrdered,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      total: allPrescriptionsCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(allPrescriptionsCount / parseInt(limit))
    },
    orders: {
      data: allOrders.map(o => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        patient: o.patient?.user ? {
          _id: o.patient._id,
          name: `${o.patient.user.firstName} ${o.patient.user.lastName}`,
          email: o.patient.user.email,
          phoneNumber: o.patient.user.phoneNumber
        } : null,
        items: o.items || [],
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      })),
      total: allOrdersCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(allOrdersCount / parseInt(limit))
    },
    consultations: {
      data: allConsultations.map(c => ({
        _id: c._id,
        patient: c.patient?.user ? {
          _id: c.patient._id,
          name: `${c.patient.user.firstName} ${c.patient.user.lastName}`,
          email: c.patient.user.email,
          phoneNumber: c.patient.user.phoneNumber
        } : null,
        doctor: c.doctor?.user ? {
          _id: c.doctor._id,
          name: `Dr. ${c.doctor.user.firstName} ${c.doctor.user.lastName}`,
          email: c.doctor.user.email,
          phoneNumber: c.doctor.user.phoneNumber
        } : null,
        status: c.status,
        messagesCount: c.messages?.length || 0,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      total: allConsultationsCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(allConsultationsCount / parseInt(limit))
    },
    users: {
      data: allUsers.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phoneNumber: u.phoneNumber,
        role: u.role,
        createdAt: u.createdAt
      })),
      total: allUsersCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(allUsersCount / parseInt(limit))
    },
    payments: {
      data: allPayments.map(pay => ({
        _id: pay._id,
        transactionId: pay.transactionId,
        patient: pay.patient?.user ? {
          _id: pay.patient._id,
          name: `${pay.patient.user.firstName} ${pay.patient.user.lastName}`,
          email: pay.patient.user.email,
          phoneNumber: pay.patient.user.phoneNumber
        } : null,
        amount: pay.amount,
        paymentMethod: pay.paymentMethod,
        paymentStatus: pay.paymentStatus,
        type: pay.type,
        createdAt: pay.createdAt,
        updatedAt: pay.updatedAt
      })),
      total: allPaymentsCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(allPaymentsCount / parseInt(limit))
    }
  };

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
    },
    list: listData,
    filters: {
      period: period,
      region: region || 'all',
      doctorId: doctorId || 'all',
      medicationId: medicationId || 'all'
    },
    filterOptions: {
      regions: regionsList,
      doctors: doctorsList,
      medications: medicationsList
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

// Get Filter Options for Dashboard
exports.getFilterOptions = async () => {
  try {
    // Get unique regions/states from addresses
    const regions = await Address.distinct('state', { state: { $exists: true, $ne: null, $ne: '' } })
      .then(states => states.sort().map(state => ({ id: state, name: state })));

    // Also get regions from doctor addresses if they exist
    const doctorAddresses = await Doctor.distinct('address.state', { 'address.state': { $exists: true, $ne: null, $ne: '' } });
    const allRegions = [...new Set([...regions.map(r => r.id), ...doctorAddresses])]
      .sort()
      .map(state => ({ id: state, name: state }));

    // Get all active doctors (simplified list)
    const doctors = await Doctor.find({ isActive: true, status: 'active' })
      .populate('user', 'firstName lastName email')
      .populate('specialty', 'name')
      .select('user specialty consultationFee rating status')
      .lean()
      .then(docs => docs.map(doc => ({
        _id: doc._id,
        name: doc.user ? `${doc.user.firstName} ${doc.user.lastName}` : 'Unknown',
        email: doc.user?.email,
        specialty: doc.specialty?.name || 'N/A',
        consultationFee: doc.consultationFee,
        rating: doc.rating?.average || 0
      })));

    // Get all active medications/medicines (simplified list)
    const medications = await Medicine.find({ isActive: true })
      .select('productName brand category salePrice originalPrice status images')
      .sort({ productName: 1 })
      .lean()
      .limit(500) // Limit to 500 most recent for performance
      .then(meds => meds.map(med => ({
        _id: med._id,
        name: med.productName,
        brand: med.brand,
        category: med.category,
        salePrice: med.salePrice,
        originalPrice: med.originalPrice,
        status: med.status,
        image: med.images?.gallery?.[0] || med.images?.thumbnail || null
      })));

    // Period options
    const periods = [
      { id: 'today', name: 'Today' },
      { id: 'last_7_days', name: 'Last 7 Days' },
      { id: 'last_30_days', name: 'Last 30 Days' },
      { id: 'last_90_days', name: 'Last 90 Days' },
      { id: 'last_365_days', name: 'Last 365 Days' },
      { id: 'this_month', name: 'This Month' },
      { id: 'last_month', name: 'Last Month' },
      { id: 'this_year', name: 'This Year' }
    ];

    return {
      regions: allRegions,
      doctors: doctors,
      medications: medications,
      periods: periods
    };
  } catch (error) {
    throw new AppError(`Error fetching filter options: ${error.message}`, 500);
  }
};

