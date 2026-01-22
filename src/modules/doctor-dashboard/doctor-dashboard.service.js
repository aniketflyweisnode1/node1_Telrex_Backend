/**
 * Doctor Dashboard Service
 * Refactored to use shared helpers
 */

const Doctor = require('../../models/Doctor.model');
const IntakeForm = require('../../models/IntakeForm.model');
const Prescription = require('../../models/Prescription.model');
const Refill = require('../../models/Refill.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');
const {
  getDoctor,
  getDoctorById,
  ensureObjectId,
  getDateRange,
  getPreviousPeriodRange,
  calculatePercentageChange,
  formatPercentageChange,
  parsePagination,
  buildPaginationResponse
} = require('../../helpers');

/**
 * Get dashboard overview data
 */
exports.getDashboardOverview = async (userId, query = {}) => {
  // Get doctor (from query or userId)
  let doctor, doctorId;
  
  if (query.doctorId) {
    doctor = await getDoctorById(query.doctorId, { lean: false });
    doctorId = doctor._id;
  } else {
    doctor = await getDoctor(userId);
    doctorId = doctor._id;
  }

  const doctorObjectId = ensureObjectId(doctorId);
  const period = query.period || 'all';
  
  // Get date ranges
  const { startDate, endDate, dateFilter } = getDateRange(period);
  const { previousPeriodStart, previousPeriodEnd, previousDateFilter } = getPreviousPeriodRange(period);

  // Build consultation filter
  const consultationsFilter = { 
    doctor: doctorObjectId, 
    status: 'submitted' 
  };
  
  if (period !== 'all' && Object.keys(dateFilter).length > 0) {
    consultationsFilter.createdAt = dateFilter;
  }

  // Calculate all metrics in parallel
  const [
    totalConsultations,
    previousConsultations,
    prescriptionsIssued,
    previousPrescriptions,
    totalEarnings,
    previousEarnings
  ] = await Promise.all([
    IntakeForm.countDocuments(consultationsFilter),
    previousPeriodStart && previousPeriodEnd
      ? IntakeForm.countDocuments({
          doctor: doctorObjectId,
          status: 'submitted',
          createdAt: previousDateFilter
        })
      : 0,
    IntakeForm.countDocuments(consultationsFilter),
    previousPeriodStart && previousPeriodEnd
      ? IntakeForm.countDocuments({
          doctor: doctorObjectId,
          status: 'submitted',
          createdAt: previousDateFilter
        })
      : 0,
    DoctorPayout.aggregate([
      {
        $match: {
          doctor: doctorObjectId,
          status: 'completed',
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(result => result[0]?.total || 0),
    previousPeriodStart && previousPeriodEnd
      ? DoctorPayout.aggregate([
          { $match: { doctor: doctorObjectId, status: 'completed', createdAt: previousDateFilter } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0)
      : 0
  ]);

  // Calculate changes
  const consultationsChange = formatPercentageChange(calculatePercentageChange(totalConsultations, previousConsultations));
  const prescriptionsChange = formatPercentageChange(calculatePercentageChange(prescriptionsIssued, previousPrescriptions));
  const earningsChange = formatPercentageChange(calculatePercentageChange(totalEarnings, previousEarnings));

  return {
    metrics: {
      totalConsultations: {
        value: totalConsultations,
        change: consultationsChange.formatted,
        trend: consultationsChange.trend
      },
      prescriptionsIssued: {
        value: prescriptionsIssued,
        change: prescriptionsChange.formatted,
        trend: prescriptionsChange.trend
      },
      totalEarnings: {
        value: totalEarnings,
        change: earningsChange.formatted,
        trend: earningsChange.trend,
        currency: 'USD'
      },
      patientRating: {
        value: doctor.rating?.average || 0,
        totalRatings: doctor.rating?.totalRatings || 0
      }
    },
    period: period,
    dateRange: startDate && endDate ? {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    } : null
  };
};

/**
 * Get recent consultations
 */
exports.getRecentConsultations = async (userId, query = {}) => {
  let doctor, doctorId;
  
  if (query.doctorId) {
    doctor = await getDoctorById(query.doctorId);
    doctorId = doctor._id;
  } else {
    doctor = await getDoctor(userId);
    doctorId = doctor._id;
  }
  
  const doctorObjectId = ensureObjectId(doctorId);
  const { page, limit, skip } = parsePagination(query);

  // Get intake forms assigned to this doctor
  const intakeForms = await IntakeForm.find({ 
    doctor: doctorObjectId,
    status: 'submitted'
  })
    .populate({
      path: 'patient',
      select: 'user dateOfBirth gender',
      populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  // Get patient IDs and fetch refills
  const patientIds = intakeForms.map(form => form.patient?._id).filter(Boolean);
  
  const refills = patientIds.length > 0 
    ? await Refill.find({
        patient: { $in: patientIds },
        status: { $in: ['pending', 'approved'] }
      })
        .populate({ path: 'medicine', select: 'productName brand images' })
        .sort({ createdAt: -1 })
        .lean()
    : [];

  // Group refills by patient
  const refillsByPatient = {};
  refills.forEach(refill => {
    const patientId = refill.patient?.toString();
    if (patientId) {
      if (!refillsByPatient[patientId]) refillsByPatient[patientId] = [];
      refillsByPatient[patientId].push({
        _id: refill._id,
        refillNumber: refill.refillNumber,
        medicationName: refill.medicationName,
        medicine: refill.medicine,
        quantity: refill.quantity,
        status: refill.status,
        createdAt: refill.createdAt
      });
    }
  });

  // Format consultations
  const consultations = intakeForms.map(intakeForm => {
    const patient = intakeForm.patient?.user;
    const patientId = intakeForm.patient?._id?.toString();
    const patientName = patient 
      ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() 
      : intakeForm.basicInformation?.firstName 
        ? `${intakeForm.basicInformation.firstName} ${intakeForm.basicInformation.lastName}`.trim()
        : 'Unknown Patient';
    
    const condition = intakeForm.medicalQuestions?.pastMedicalHistory?.join(', ') || 'Consultation Request';
    const consultationDate = new Date(intakeForm.createdAt);
    const patientRefills = patientId ? (refillsByPatient[patientId] || []) : [];

    return {
      id: intakeForm._id,
      patientName,
      reason: condition,
      time: consultationDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      date: consultationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      status: intakeForm.status === 'submitted' ? 'Pending' : intakeForm.status,
      intakeFormId: intakeForm._id,
      refills: patientRefills,
      refillCount: patientRefills.length
    };
  });

  const total = await IntakeForm.countDocuments({ doctor: doctorObjectId, status: 'submitted' });

  return {
    consultations,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

/**
 * Get today's schedule
 */
exports.getTodaysSchedule = async (userId, query = {}) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get prescriptions with follow-up dates today
  const [followUpPrescriptions, todaysPrescriptions] = await Promise.all([
    Prescription.find({
      doctor: doctorId,
      followUpDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    })
      .populate({
        path: 'patient',
        select: 'user',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
      })
      .sort({ followUpDate: 1 }),
    Prescription.find({
      doctor: doctorId,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    })
      .populate({
        path: 'patient',
        select: 'user',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
      })
      .sort({ createdAt: 1 })
  ]);

  // Combine and deduplicate
  const prescriptionIds = new Set(followUpPrescriptions.map(p => p._id.toString()));
  const allPrescriptions = [...followUpPrescriptions];
  todaysPrescriptions.forEach(p => {
    if (!prescriptionIds.has(p._id.toString())) allPrescriptions.push(p);
  });

  // Format schedule
  const schedule = allPrescriptions.map(prescription => {
    const patient = prescription.patient?.user;
    const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown Patient';
    const scheduleDate = prescription.followUpDate || prescription.createdAt;
    
    return {
      id: prescription._id,
      patientName,
      reason: prescription.diagnosis || 'Consultation',
      consultationType: prescription.followUpDate ? 'Follow-up' : 'New Consultation',
      time: new Date(scheduleDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      prescriptionNumber: prescription.prescriptionNumber
    };
  });

  schedule.sort((a, b) => a.time.localeCompare(b.time));

  return {
    schedule,
    date: today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  };
};
