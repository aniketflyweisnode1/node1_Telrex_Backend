/**
 * Doctor Earnings Service (Doctor Panel)
 * Refactored to use shared helpers
 */

const Prescription = require('../../models/Prescription.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const IntakeForm = require('../../models/IntakeForm.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const {
  getDoctor,
  getDateRange,
  getPreviousPeriodRange,
  calculatePercentageChange,
  formatPercentageChange,
  formatCurrency,
  formatBankAccount,
  parsePagination,
  buildPaginationResponse
} = require('../../helpers');

/**
 * Get earnings summary for logged-in doctor
 */
exports.getEarningsSummary = async (userId, query = {}) => {
  const doctor = await getDoctor(userId, { populate: true });
  const doctorId = doctor._id;

  const period = query.period || 'all';
  const { dateFilter } = getDateRange(period);
  const { previousPeriodStart, previousPeriodEnd, previousDateFilter } = getPreviousPeriodRange(period);

  // Build filters
  const consultationsFilter = { doctor: doctorId, status: { $ne: 'cancelled' } };
  const completedPayoutsFilter = { doctor: doctorId, status: 'completed' };
  const pendingPayoutsFilter = { doctor: doctorId, status: { $in: ['pending', 'processing'] } };

  if (Object.keys(dateFilter).length > 0) {
    consultationsFilter.createdAt = dateFilter;
    completedPayoutsFilter.processedAt = dateFilter;
  }

  // Run all queries in parallel
  const [consultationsCount, completedPayouts, pendingPayouts] = await Promise.all([
    Prescription.countDocuments(consultationsFilter),
    DoctorPayout.aggregate([
      { $match: completedPayoutsFilter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    DoctorPayout.aggregate([
      { $match: pendingPayoutsFilter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
  ]);

  const totalEarnings = consultationsCount * (doctor.consultationFee || 0);
  const paidOutAmount = completedPayouts[0]?.total || 0;
  const paidOutCount = completedPayouts[0]?.count || 0;
  const pendingPayoutAmount = pendingPayouts[0]?.total || 0;
  const pendingPayoutCount = pendingPayouts[0]?.count || 0;
  const availableEarnings = totalEarnings - paidOutAmount - pendingPayoutAmount;

  // Calculate change from previous period
  let earningsChange = 0;
  if (period !== 'all' && period !== 'today' && previousPeriodStart && previousPeriodEnd) {
    const previousConsultations = await Prescription.countDocuments({
      doctor: doctorId,
      status: { $ne: 'cancelled' },
      createdAt: previousDateFilter
    });
    const previousEarnings = previousConsultations * (doctor.consultationFee || 0);
    earningsChange = calculatePercentageChange(totalEarnings, previousEarnings);
  }

  const change = formatPercentageChange(earningsChange);

  return {
    summary: {
      totalEarnings: { value: totalEarnings, change: change.formatted, trend: change.trend },
      availableEarnings: { value: availableEarnings > 0 ? availableEarnings : 0 },
      paidOut: { value: paidOutAmount, count: paidOutCount },
      pendingPayouts: { value: pendingPayoutAmount, count: pendingPayoutCount },
      consultations: { count: consultationsCount },
      consultationFee: doctor.consultationFee || 0
    },
    period,
    doctor: {
      id: doctor._id,
      name: `${doctor.user.firstName} ${doctor.user.lastName}`,
      specialty: doctor.specialty,
      bankAccount: doctor.bankAccount || null
    }
  };
};

/**
 * Get payout requests for logged-in doctor
 */
exports.getPayoutRequests = async (userId, query = {}) => {
  const doctor = await getDoctor(userId, { populate: true });
  const doctorId = doctor._id;

  const { page, limit, skip } = parsePagination(query);
  const filter = { doctor: doctorId };
  if (query.status) filter.status = query.status;

  const payouts = await DoctorPayout.find(filter)
    .populate({
      path: 'doctor',
      select: 'user consultationFee specialty',
      populate: [
        { path: 'user', select: 'firstName lastName email profilePicture phoneNumber countryCode' },
        { path: 'specialty', select: 'name' }
      ]
    })
    .populate({ path: 'processedBy', select: 'firstName lastName email' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Format payouts
  const formattedPayouts = payouts.map(payout => ({
    _id: payout._id,
    payoutId: payout.payoutId || null,
    doctor: payout.doctor ? {
      _id: payout.doctor._id,
      name: payout.doctor.user ? `${payout.doctor.user.firstName || ''} ${payout.doctor.user.lastName || ''}`.trim() : 'Unknown',
      email: payout.doctor.user?.email || '',
      specialty: payout.doctor.specialty?.name || 'N/A',
      consultationFee: payout.doctor.consultationFee || 0
    } : null,
    amount: payout.amount,
    amountDisplay: formatCurrency(payout.amount),
    currency: payout.currency || 'USD',
    status: payout.status,
    statusDisplay: payout.status.charAt(0).toUpperCase() + payout.status.slice(1),
    payoutMethod: payout.payoutMethod || 'bank_transfer',
    bankAccount: formatBankAccount(payout.bankAccount),
    processedBy: payout.processedBy ? {
      id: payout.processedBy._id,
      name: `${payout.processedBy.firstName || ''} ${payout.processedBy.lastName || ''}`.trim()
    } : null,
    requestedAt: payout.createdAt,
    processedAt: payout.processedAt,
    createdAt: payout.createdAt,
    updatedAt: payout.updatedAt
  }));

  // Get status counts in parallel
  const [total, pending, processing, completed, failed, cancelled] = await Promise.all([
    DoctorPayout.countDocuments(filter),
    DoctorPayout.countDocuments({ doctor: doctorId, status: 'pending' }),
    DoctorPayout.countDocuments({ doctor: doctorId, status: 'processing' }),
    DoctorPayout.countDocuments({ doctor: doctorId, status: 'completed' }),
    DoctorPayout.countDocuments({ doctor: doctorId, status: 'failed' }),
    DoctorPayout.countDocuments({ doctor: doctorId, status: 'cancelled' })
  ]);

  return {
    payouts: formattedPayouts,
    summary: { total, pending, processing, completed, failed, cancelled },
    pagination: buildPaginationResponse(total, page, limit),
    filters: { status: query.status || 'all' }
  };
};

/**
 * Get payout request by ID
 */
exports.getPayoutRequestById = async (userId, payoutId) => {
  const doctor = await getDoctor(userId);
  
  const payout = await DoctorPayout.findOne({ _id: payoutId, doctor: doctor._id })
    .populate({ path: 'processedBy', select: 'firstName lastName email' })
    .lean();

  if (!payout) throw new AppError('Payout request not found', 404);

  return {
    id: payout._id,
    amount: payout.amount,
    currency: payout.currency || 'USD',
    status: payout.status,
    payoutMethod: payout.payoutMethod,
    bankAccount: formatBankAccount(payout.bankAccount),
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

/**
 * Create payout request
 */
exports.createPayoutRequest = async (userId, data) => {
  const doctor = await getDoctor(userId, { populate: true });
  const doctorId = doctor._id;

  const { amount, notes } = data;

  if (!amount || amount <= 0) {
    throw new AppError('Invalid payout amount. Amount must be greater than 0', 400);
  }

  // Calculate available earnings
  const consultationsCount = await IntakeForm.countDocuments({ doctor: doctorId, status: 'submitted' });
  const totalEarnings = consultationsCount * (doctor.consultationFee || 0);

  const [completedPayouts, pendingPayouts] = await Promise.all([
    DoctorPayout.aggregate([
      { $match: { doctor: doctorId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    DoctorPayout.aggregate([
      { $match: { doctor: doctorId, status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const paidOut = completedPayouts[0]?.total || 0;
  const pending = pendingPayouts[0]?.total || 0;
  const availableEarnings = totalEarnings - paidOut - pending;

  if (amount > availableEarnings) {
    throw new AppError(`Insufficient earnings. Available: ${availableEarnings.toFixed(2)}`, 400);
  }

  // Validate bank account
  if (!doctor.bankAccount || !doctor.bankAccount.accountHolderName || !doctor.bankAccount.accountNumber) {
    throw new AppError('Bank account details are required. Please update your bank account information first.', 400);
  }

  const payout = await DoctorPayout.create({
    doctor: doctorId,
    amount,
    currency: 'USD',
    bankAccount: {
      accountHolder: doctor.bankAccount.accountHolderName,
      bankName: doctor.bankAccount.bankName,
      accountNumber: doctor.bankAccount.accountNumber,
      routingNumber: doctor.bankAccount.routingNumber || doctor.bankAccount.ifscCode || '',
      accountType: doctor.bankAccount.accountType || 'checking'
    },
    status: 'pending',
    payoutMethod: 'bank_transfer',
    payoutGateway: 'manual',
    processedBy: doctor.user._id,
    notes
  });

  logger.info('Payout request created', { payoutId: payout._id, doctorId, amount });

  return await DoctorPayout.findById(payout._id)
    .populate({ path: 'processedBy', select: 'firstName lastName email' })
    .lean();
};

/**
 * Get doctor reports & analytics
 */
exports.getReportsAndAnalytics = async (userId, query = {}) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  const period = query.period || 'last_30_days';
  const { startDate, endDate, dateFilter } = getDateRange(period);

  const consultations = await Prescription.find({
    doctor: doctorId,
    status: { $ne: 'cancelled' },
    createdAt: dateFilter
  })
    .populate({
      path: 'patient',
      select: 'user dateOfBirth gender',
      populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
    })
    .sort({ createdAt: -1 })
    .lean();

  const consultationRequests = await IntakeForm.find({
    doctor: doctorId,
    createdAt: dateFilter
  }).lean();

  const totalConsultations = consultations.length;
  const totalRequests = consultationRequests.length;
  const totalEarnings = totalConsultations * (doctor.consultationFee || 0);

  // Group by status
  const consultationsByStatus = consultations.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const requestsByStatus = consultationRequests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  // Group by date
  const consultationsByDate = {};
  consultations.forEach(c => {
    const date = new Date(c.createdAt).toISOString().split('T')[0];
    consultationsByDate[date] = (consultationsByDate[date] || 0) + 1;
  });

  // Top diagnoses
  const diagnoses = consultations.map(c => c.diagnosis).filter(Boolean);
  const diagnosisCount = {};
  diagnoses.forEach(d => { diagnosisCount[d] = (diagnosisCount[d] || 0) + 1; });
  const topDiagnoses = Object.entries(diagnosisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([diagnosis, count]) => ({ diagnosis, count }));

  // Patient demographics
  const genders = {};
  const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
  
  consultations.forEach(c => {
    if (c.patient?.gender) genders[c.patient.gender] = (genders[c.patient.gender] || 0) + 1;
    if (c.patient?.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(c.patient.dateOfBirth).getFullYear();
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    }
  });

  return {
    period,
    dateRange: { start: startDate, end: endDate },
    summary: {
      totalConsultations,
      totalRequests,
      totalEarnings,
      averageEarningsPerConsultation: totalConsultations > 0 ? totalEarnings / totalConsultations : 0
    },
    consultations: {
      byStatus: consultationsByStatus,
      byDate: Object.entries(consultationsByDate).map(([date, count]) => ({ date, count }))
    },
    requests: { byStatus: requestsByStatus },
    insights: {
      topDiagnoses,
      patientDemographics: { gender: genders, ageGroups }
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
