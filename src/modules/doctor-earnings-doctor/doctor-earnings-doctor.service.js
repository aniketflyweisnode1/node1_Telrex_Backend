const Doctor = require('../../models/Doctor.model');
const Prescription = require('../../models/Prescription.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const IntakeForm = require('../../models/IntakeForm.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get doctor from userId
const getDoctor = async (userId) => {
  const doctor = await Doctor.findOne({ user: userId })
    .populate('user', 'firstName lastName email phoneNumber');
  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }
  return doctor;
};

// Get earnings summary for logged-in doctor
exports.getEarningsSummary = async (userId, query = {}) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  // Get date range for filtering
  const period = query.period || 'all';
  let dateFilter = {};
  
  if (period !== 'all') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'last_7_days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last_30_days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        dateFilter = { $gte: startDate, $lte: endDate };
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
    }

    if (period !== 'last_month') {
      dateFilter = { $gte: startDate };
    }
  }

  // Get consultations count (prescriptions)
  const consultationsFilter = { 
    doctor: doctorId,
    status: { $ne: 'cancelled' }
  };
  if (Object.keys(dateFilter).length > 0) {
    consultationsFilter.createdAt = dateFilter;
  }

  const consultationsCount = await Prescription.countDocuments(consultationsFilter);

  // Calculate total earnings
  const totalEarnings = consultationsCount * (doctor.consultationFee || 0);

  // Get completed payouts
  const completedPayoutsFilter = { 
    doctor: doctorId,
    status: 'completed'
  };
  if (Object.keys(dateFilter).length > 0) {
    completedPayoutsFilter.processedAt = dateFilter;
  }

  const completedPayouts = await DoctorPayout.aggregate([
    { $match: completedPayoutsFilter },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const paidOutAmount = completedPayouts[0]?.total || 0;
  const paidOutCount = completedPayouts[0]?.count || 0;

  // Get pending payouts
  const pendingPayoutsFilter = { 
    doctor: doctorId,
    status: { $in: ['pending', 'processing'] }
  };

  const pendingPayouts = await DoctorPayout.aggregate([
    { $match: pendingPayoutsFilter },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const pendingPayoutAmount = pendingPayouts[0]?.total || 0;
  const pendingPayoutCount = pendingPayouts[0]?.count || 0;

  // Calculate available earnings
  const availableEarnings = totalEarnings - paidOutAmount - pendingPayoutAmount;

  // Calculate percentage change for previous period
  let earningsChange = 0;
  if (period !== 'all' && period !== 'today') {
    const now = new Date();
    let previousPeriodStart, previousPeriodEnd;

    switch (period) {
      case 'last_7_days':
        previousPeriodEnd = new Date(now);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        break;
      case 'last_30_days':
        previousPeriodEnd = new Date(now);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
        break;
      case 'this_month':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'last_month':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
        break;
    }

    if (previousPeriodStart && previousPeriodEnd) {
      const previousConsultations = await Prescription.countDocuments({
        doctor: doctorId,
        status: { $ne: 'cancelled' },
        createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
      });

      const previousEarnings = previousConsultations * (doctor.consultationFee || 0);

      if (previousEarnings > 0) {
        earningsChange = ((totalEarnings - previousEarnings) / previousEarnings) * 100;
      } else if (totalEarnings > 0) {
        earningsChange = 100;
      }
    }
  }

  return {
    summary: {
      totalEarnings: {
        value: totalEarnings,
        change: earningsChange > 0 ? `+${earningsChange.toFixed(1)}%` : earningsChange < 0 ? `${earningsChange.toFixed(1)}%` : '0%',
        trend: earningsChange >= 0 ? 'up' : 'down'
      },
      availableEarnings: {
        value: availableEarnings > 0 ? availableEarnings : 0
      },
      paidOut: {
        value: paidOutAmount,
        count: paidOutCount
      },
      pendingPayouts: {
        value: pendingPayoutAmount,
        count: pendingPayoutCount
      },
      consultations: {
        count: consultationsCount
      },
      consultationFee: doctor.consultationFee || 0
    },
    period: period,
    doctor: {
      id: doctor._id,
      name: `${doctor.user.firstName} ${doctor.user.lastName}`,
      specialty: doctor.specialty,
      bankAccount: doctor.bankAccount || null
    }
  };
};

// Get payout requests for logged-in doctor
exports.getPayoutRequests = async (userId, query = {}) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { doctor: doctorId };

  // Filter by status
  if (query.status) {
    filter.status = query.status;
  }

  // Get payouts with populated data
  const payouts = await DoctorPayout.find(filter)
    .populate({
      path: 'processedBy',
      select: 'firstName lastName email'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  // Format payouts
  const formattedPayouts = payouts.map(payout => ({
    id: payout._id,
    amount: payout.amount,
    currency: payout.currency || 'USD',
    status: payout.status,
    payoutMethod: payout.payoutMethod,
    bankAccount: payout.bankAccount ? {
      accountHolderName: payout.bankAccount.accountHolder,
      bankName: payout.bankAccount.bankName,
      accountNumber: payout.bankAccount.accountNumber ? `****${payout.bankAccount.accountNumber.slice(-4)}` : null,
      routingNumber: payout.bankAccount.routingNumber ? `****${payout.bankAccount.routingNumber.slice(-4)}` : null,
      accountType: payout.bankAccount.accountType
    } : null,
    transactionId: payout.transactionId,
    notes: payout.notes,
    failureReason: payout.failureReason,
    processedBy: payout.processedBy ? {
      id: payout.processedBy._id,
      name: `${payout.processedBy.firstName} ${payout.processedBy.lastName}`,
      email: payout.processedBy.email
    } : null,
    requestedAt: payout.createdAt,
    processedAt: payout.processedAt,
    failedAt: payout.failedAt
  }));

  const total = await DoctorPayout.countDocuments(filter);

  return {
    payouts: formattedPayouts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get payout request by ID
exports.getPayoutRequestById = async (userId, payoutId) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  const payout = await DoctorPayout.findOne({
    _id: payoutId,
    doctor: doctorId
  })
    .populate({
      path: 'processedBy',
      select: 'firstName lastName email'
    })
    .lean();

  if (!payout) {
    throw new AppError('Payout request not found', 404);
  }

  return {
    id: payout._id,
    amount: payout.amount,
    currency: payout.currency || 'USD',
    status: payout.status,
    payoutMethod: payout.payoutMethod,
    bankAccount: payout.bankAccount || null,
    transactionId: payout.transactionId,
    notes: payout.notes,
    failureReason: payout.failureReason,
    processedBy: payout.processedBy ? {
      id: payout.processedBy._id,
      name: `${payout.processedBy.firstName} ${payout.processedBy.lastName}`,
      email: payout.processedBy.email
    } : null,
    requestedAt: payout.createdAt,
    processedAt: payout.processedAt,
    failedAt: payout.failedAt
  };
};

// Create payout request
exports.createPayoutRequest = async (userId, data) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  const { amount, notes } = data;

  // Validate amount
  if (!amount || amount <= 0) {
    throw new AppError('Invalid payout amount. Amount must be greater than 0', 400);
  }

  // Get available earnings
  const consultationsCount = await Prescription.countDocuments({ 
    doctor: doctorId,
    status: { $ne: 'cancelled' }
  });
  
  const totalEarnings = consultationsCount * (doctor.consultationFee || 0);

  const completedPayouts = await DoctorPayout.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const pendingPayouts = await DoctorPayout.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: { $in: ['pending', 'processing'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const paidOut = completedPayouts[0]?.total || 0;
  const pending = pendingPayouts[0]?.total || 0;
  const availableEarnings = totalEarnings - paidOut - pending;

  if (amount > availableEarnings) {
    throw new AppError(`Insufficient earnings. Available: ${availableEarnings.toFixed(2)}`, 400);
  }

  // Check if bank account is set
  if (!doctor.bankAccount || !doctor.bankAccount.accountHolderName || !doctor.bankAccount.bankName || 
      !doctor.bankAccount.accountNumber) {
    throw new AppError('Bank account details are required. Please update your bank account information first.', 400);
  }

  // Create payout request
  // Note: processedBy is required in model, so we set it to doctor's user ID initially
  // Admin will update it when processing the payout
  const payout = await DoctorPayout.create({
    doctor: doctorId,
    amount: amount,
    currency: 'USD',
    bankAccount: {
      accountHolder: doctor.bankAccount.accountHolderName, // Model expects accountHolder
      bankName: doctor.bankAccount.bankName,
      accountNumber: doctor.bankAccount.accountNumber,
      routingNumber: doctor.bankAccount.routingNumber || doctor.bankAccount.ifscCode || '',
      accountType: doctor.bankAccount.accountType || 'checking'
    },
    status: 'pending',
    payoutMethod: 'bank_transfer',
    payoutGateway: 'manual',
    processedBy: doctor.user._id, // Set to doctor initially, admin will update when processing
    notes: notes
  });

  logger.info('Payout request created', {
    payoutId: payout._id,
    doctorId,
    amount
  });

  return await DoctorPayout.findById(payout._id)
    .populate({
      path: 'processedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Get doctor reports & analytics
exports.getReportsAndAnalytics = async (userId, query = {}) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  // Get date range
  const period = query.period || 'last_30_days';
  const now = new Date();
  let startDate, endDate = now;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
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

  const dateFilter = { $gte: startDate, $lte: endDate };

  // Get consultations (prescriptions)
  const consultations = await Prescription.find({
    doctor: doctorId,
    status: { $ne: 'cancelled' },
    createdAt: dateFilter
  })
    .populate({
      path: 'patient',
      select: 'user dateOfBirth gender',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber'
      }
    })
    .sort({ createdAt: -1 })
    .lean();

  // Get intake forms (consultation requests)
  const consultationRequests = await IntakeForm.find({
    doctor: doctorId,
    createdAt: dateFilter
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
    .lean();

  // Calculate statistics
  const totalConsultations = consultations.length;
  const totalRequests = consultationRequests.length;
  const totalEarnings = totalConsultations * (doctor.consultationFee || 0);

  // Group by status
  const consultationsByStatus = consultations.reduce((acc, consultation) => {
    acc[consultation.status] = (acc[consultation.status] || 0) + 1;
    return acc;
  }, {});

  const requestsByStatus = consultationRequests.reduce((acc, request) => {
    acc[request.status] = (acc[request.status] || 0) + 1;
    return acc;
  }, {});

  // Group by date for chart data
  const consultationsByDate = {};
  consultations.forEach(consultation => {
    const date = new Date(consultation.createdAt).toISOString().split('T')[0];
    consultationsByDate[date] = (consultationsByDate[date] || 0) + 1;
  });

  // Get top diagnoses
  const diagnoses = consultations.map(c => c.diagnosis).filter(Boolean);
  const diagnosisCount = {};
  diagnoses.forEach(diagnosis => {
    diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
  });
  const topDiagnoses = Object.entries(diagnosisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([diagnosis, count]) => ({ diagnosis, count }));

  // Get patient demographics
  const genders = {};
  consultations.forEach(consultation => {
    if (consultation.patient?.gender) {
      genders[consultation.patient.gender] = (genders[consultation.patient.gender] || 0) + 1;
    }
  });

  // Calculate age groups
  const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
  consultations.forEach(consultation => {
    if (consultation.patient?.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(consultation.patient.dateOfBirth).getFullYear();
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    }
  });

  return {
    period: period,
    dateRange: {
      start: startDate,
      end: endDate
    },
    summary: {
      totalConsultations: totalConsultations,
      totalRequests: totalRequests,
      totalEarnings: totalEarnings,
      averageEarningsPerConsultation: totalConsultations > 0 ? totalEarnings / totalConsultations : 0
    },
    consultations: {
      byStatus: consultationsByStatus,
      byDate: Object.entries(consultationsByDate).map(([date, count]) => ({ date, count }))
    },
    requests: {
      byStatus: requestsByStatus
    },
    insights: {
      topDiagnoses: topDiagnoses,
      patientDemographics: {
        gender: genders,
        ageGroups: ageGroups
      }
    },
    recentConsultations: consultations.slice(0, 10).map(c => ({
      id: c._id,
      prescriptionNumber: c.prescriptionNumber,
      patient: c.patient?.user ? {
        name: `${c.patient.user.firstName} ${c.patient.user.lastName}`,
        email: c.patient.user.email
      } : null,
      diagnosis: c.diagnosis,
      status: c.status,
      createdAt: c.createdAt
    }))
  };
};

