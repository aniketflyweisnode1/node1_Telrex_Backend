const Doctor = require('../../models/Doctor.model');
const Prescription = require('../../models/Prescription.model');
const IntakeForm = require('../../models/IntakeForm.model');
const Chat = require('../../models/Chat.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const Refill = require('../../models/Refill.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const Payment = require('../../models/Payment.model');
const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get doctor from userId
const getDoctor = async (userId) => {
  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) {
    throw new AppError('Doctor profile not found. Please contact an administrator to create your doctor profile.', 404);
  }
  return doctor;
};

// Get dashboard overview data
exports.getDashboardOverview = async (userId, query = {}) => {
  // If doctorId is provided in query, use it directly
  let doctor;
  let doctorId;
  
  if (query.doctorId) {
    doctor = await Doctor.findById(query.doctorId);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    doctorId = doctor._id;
  } else {
    doctor = await getDoctor(userId);
    doctorId = doctor._id;
  }

  // Helper function to get date range based on period
  const getDateRange = (period) => {
    const now = new Date();
    let startDate, endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'daily':
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
      case 'last_7_days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last_30_days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        // 'all' or unknown - no date filter
        return { startDate: null, endDate: null };
    }

    return { startDate, endDate };
  };

  // Get date range for filtering
  const period = query.period || 'all';
  const { startDate, endDate } = getDateRange(period);
  let dateFilter = {};
  
  if (startDate && endDate) {
    dateFilter = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    dateFilter = { $gte: startDate };
  }

  // Total Consultations (count of intake forms with status 'submitted')
  // Ensure doctorId is ObjectId
  const doctorObjectId = doctorId instanceof mongoose.Types.ObjectId 
    ? doctorId 
    : new mongoose.Types.ObjectId(doctorId.toString());
  
  // Build filter - always include doctor and status
  const totalConsultationsFilter = { 
    doctor: doctorObjectId, 
    status: 'submitted' 
  };
  
  // Only add date filter if period is not 'all' and dateFilter is not empty
  if (period !== 'all' && Object.keys(dateFilter).length > 0) {
    totalConsultationsFilter.createdAt = dateFilter;
  }
  
  // Helper function to get previous period date range
  const getPreviousPeriodRange = (period) => {
    const now = new Date();
    let previousPeriodStart, previousPeriodEnd;

    switch (period) {
      case 'daily':
      case 'today':
        // Previous day
        previousPeriodEnd = new Date(now);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        previousPeriodEnd.setHours(23, 59, 59, 999);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
      case 'last_7_days':
        previousPeriodEnd = new Date(now);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
        previousPeriodEnd.setHours(23, 59, 59, 999);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        previousPeriodStart.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
      case 'this_month':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodStart.setHours(0, 0, 0, 0);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'last_30_days':
        previousPeriodEnd = new Date(now);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30);
        previousPeriodEnd.setHours(23, 59, 59, 999);
        previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
        previousPeriodStart.setHours(0, 0, 0, 0);
        break;
      case 'last_month':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        previousPeriodStart.setHours(0, 0, 0, 0);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
        break;
      default:
        return { previousPeriodStart: null, previousPeriodEnd: null };
    }

    return { previousPeriodStart, previousPeriodEnd };
  };

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  // Get previous period range
  const { previousPeriodStart, previousPeriodEnd } = getPreviousPeriodRange(period);
  let previousDateFilter = {};
  if (previousPeriodStart && previousPeriodEnd) {
    previousDateFilter = { $gte: previousPeriodStart, $lte: previousPeriodEnd };
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
    // Current period consultations
    IntakeForm.countDocuments(totalConsultationsFilter),
    
    // Previous period consultations
    previousPeriodStart && previousPeriodEnd
      ? IntakeForm.countDocuments({
          doctor: doctorObjectId,
          status: 'submitted',
          createdAt: previousDateFilter
        })
      : Promise.resolve(0),
    
    // Current period prescriptions (same as consultations for now)
    IntakeForm.countDocuments(totalConsultationsFilter),
    
    // Previous period prescriptions
    previousPeriodStart && previousPeriodEnd
      ? IntakeForm.countDocuments({
          doctor: doctorObjectId,
          status: 'submitted',
          createdAt: previousDateFilter
        })
      : Promise.resolve(0),
    
    // Current period earnings (from completed payouts)
    DoctorPayout.aggregate([
      {
        $match: {
          doctor: doctorObjectId,
          status: 'completed',
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]).then(result => result[0]?.total || 0),
    
    // Previous period earnings
    previousPeriodStart && previousPeriodEnd
      ? DoctorPayout.aggregate([
          {
            $match: {
              doctor: doctorObjectId,
              status: 'completed',
              createdAt: previousDateFilter
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]).then(result => result[0]?.total || 0)
      : Promise.resolve(0)
  ]);

  // Calculate percentage changes
  const consultationsChange = calculatePercentageChange(totalConsultations, previousConsultations);
  const prescriptionsChange = calculatePercentageChange(prescriptionsIssued, previousPrescriptions);
  const earningsChange = calculatePercentageChange(totalEarnings, previousEarnings);

  // Patient Rating (from doctor profile - doesn't change with period)
  const patientRating = doctor.rating?.average || 0;
  const totalRatings = doctor.rating?.totalRatings || 0;

  return {
    metrics: {
      totalConsultations: {
        value: totalConsultations,
        change: consultationsChange > 0 ? `+${consultationsChange.toFixed(1)}%` : consultationsChange < 0 ? `${consultationsChange.toFixed(1)}%` : '0%',
        trend: consultationsChange >= 0 ? 'up' : 'down'
      },
      prescriptionsIssued: {
        value: prescriptionsIssued,
        change: prescriptionsChange > 0 ? `+${prescriptionsChange.toFixed(1)}%` : prescriptionsChange < 0 ? `${prescriptionsChange.toFixed(1)}%` : '0%',
        trend: prescriptionsChange >= 0 ? 'up' : 'down'
      },
      totalEarnings: {
        value: totalEarnings,
        change: earningsChange > 0 ? `+${earningsChange.toFixed(1)}%` : earningsChange < 0 ? `${earningsChange.toFixed(1)}%` : '0%',
        trend: earningsChange >= 0 ? 'up' : 'down',
        currency: 'USD'
      },
      patientRating: {
        value: patientRating,
        totalRatings: totalRatings
      }
    },
    period: period,
    dateRange: startDate && endDate ? {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    } : null
  };
};

// Get recent consultations
exports.getRecentConsultations = async (userId, query = {}) => {
  // If doctorId is provided in query, use it directly
  let doctor;
  let doctorId;
  
  if (query.doctorId) {
    doctor = await Doctor.findById(query.doctorId);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    doctorId = doctor._id;
  } else {
    doctor = await getDoctor(userId);
    doctorId = doctor._id;
  }
  
  // Ensure doctorId is ObjectId
  const doctorObjectId = doctorId instanceof mongoose.Types.ObjectId 
    ? doctorId 
    : new mongoose.Types.ObjectId(doctorId.toString());

  const limit = parseInt(query.limit) || 10;
  const page = parseInt(query.page) || 1;
  const skip = (page - 1) * limit;

  // Get recent intake forms (consultation requests) assigned to this doctor
  const intakeForms = await IntakeForm.find({ 
    doctor: doctorObjectId,
    status: 'submitted' // Only show submitted (pending) consultations
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
    .limit(limit)
    .skip(skip)
    .lean();

  // Get patient IDs from intake forms
  const patientIds = intakeForms
    .map(form => form.patient?._id)
    .filter(id => id);

  // Get refills for these patients
  const refills = await Refill.find({
    patient: { $in: patientIds },
    status: { $in: ['pending', 'approved'] } // Only active refills
  })
    .populate({
      path: 'medicine',
      select: 'productName brand images'
    })
    .populate({
      path: 'patient',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .sort({ createdAt: -1 })
    .lean();

  // Group refills by patient ID
  const refillsByPatient = {};
  refills.forEach(refill => {
    const patientId = refill.patient?._id?.toString();
    if (patientId) {
      if (!refillsByPatient[patientId]) {
        refillsByPatient[patientId] = [];
      }
      refillsByPatient[patientId].push({
        _id: refill._id,
        refillNumber: refill.refillNumber,
        medicationName: refill.medicationName,
        medicine: refill.medicine ? {
          _id: refill.medicine._id,
          productName: refill.medicine.productName,
          brand: refill.medicine.brand,
          images: refill.medicine.images
        } : null,
        quantity: refill.quantity,
        dosage: refill.dosage,
        frequency: refill.frequency,
        instructions: refill.instructions,
        status: refill.status,
        unitPrice: refill.unitPrice,
        totalPrice: refill.totalPrice,
        notes: refill.notes,
        refillCount: refill.refillCount,
        maxRefills: refill.maxRefills,
        autoRefill: refill.autoRefill,
        autoRefillFrequency: refill.autoRefillFrequency,
        requestedDate: refill.requestedDate,
        approvedDate: refill.approvedDate,
        createdAt: refill.createdAt,
        updatedAt: refill.updatedAt
      });
    }
  });

  // Format consultations with intake form details and refill data
  const consultations = intakeForms.map(intakeForm => {
    const patient = intakeForm.patient?.user;
    const patientId = intakeForm.patient?._id?.toString();
    const patientName = patient 
      ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() 
      : intakeForm.basicInformation?.firstName && intakeForm.basicInformation?.lastName
        ? `${intakeForm.basicInformation.firstName} ${intakeForm.basicInformation.lastName}`.trim()
        : 'Unknown Patient';
    
    // Determine status based on intake form status
    let status = 'Pending';
    let statusType = 'info';
    
    if (intakeForm.status === 'submitted') {
      status = 'Pending';
      statusType = 'info';
    } else if (intakeForm.status === 'reviewed') {
      status = 'Reviewed';
      statusType = 'success';
    } else if (intakeForm.status === 'draft') {
      status = 'Draft';
      statusType = 'warning';
    }

    // Check if it's urgent based on medical questions keywords
    const medicalHistory = intakeForm.medicalQuestions?.pastMedicalHistory || [];
    const symptoms = medicalHistory.join(' ').toLowerCase();
    const isUrgent = symptoms.includes('urgent') ||
                     symptoms.includes('emergency') ||
                     symptoms.includes('chest pain') ||
                     symptoms.includes('shortness of breath') ||
                     symptoms.includes('severe') ||
                     symptoms.includes('acute');

    if (isUrgent && intakeForm.status === 'submitted') {
      status = 'Urgent';
      statusType = 'error';
    }

    // Get condition/reason from medical questions
    const condition = intakeForm.medicalQuestions?.pastMedicalHistory?.join(', ') || 
                     intakeForm.medicalQuestions?.currentMedications?.join(', ') || 
                     'Consultation Request';

    // Format time
    const consultationDate = new Date(intakeForm.createdAt);
    const timeString = consultationDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Get refills for this patient
    const patientRefills = patientId ? (refillsByPatient[patientId] || []) : [];

    return {
      id: intakeForm._id,
      patientName: patientName,
      reason: condition,
      time: timeString,
      date: consultationDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      status: status,
      statusType: statusType,
      intakeFormId: intakeForm._id,
      refills: patientRefills,
      refillCount: patientRefills.length,
      intakeForm: {
        _id: intakeForm._id,
        basicInformation: intakeForm.basicInformation || null,
        emergencyContact: intakeForm.emergencyContact || null,
        medicalQuestions: intakeForm.medicalQuestions || null,
        status: intakeForm.status,
        createdAt: intakeForm.createdAt,
        updatedAt: intakeForm.updatedAt
      }
    };
  });

  return {
    consultations,
    pagination: {
      page,
      limit,
      total: await IntakeForm.countDocuments({ 
        doctor: doctorObjectId,
        status: 'submitted'
      })
    }
  };
};

// Get today's schedule
exports.getTodaysSchedule = async (userId, query = {}) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get prescriptions with follow-up dates today, or prescriptions created today
  const followUpPrescriptions = await Prescription.find({
    doctor: doctorId,
    followUpDate: {
      $gte: today,
      $lt: tomorrow
    },
    status: { $ne: 'cancelled' }
  })
    .populate({
      path: 'patient',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber'
      }
    })
    .sort({ followUpDate: 1 });

  // Get prescriptions created today (as consultations scheduled for today)
  const todaysPrescriptions = await Prescription.find({
    doctor: doctorId,
    createdAt: {
      $gte: today,
      $lt: tomorrow
    },
    status: { $ne: 'cancelled' }
  })
    .populate({
      path: 'patient',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber'
      }
    })
    .sort({ createdAt: 1 });

  // Combine and deduplicate
  const allPrescriptions = [...followUpPrescriptions];
  const prescriptionIds = new Set(followUpPrescriptions.map(p => p._id.toString()));

  todaysPrescriptions.forEach(p => {
    if (!prescriptionIds.has(p._id.toString())) {
      allPrescriptions.push(p);
    }
  });

  // Format schedule items
  const schedule = allPrescriptions.map(prescription => {
    const patient = prescription.patient?.user;
    const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Unknown Patient';
    
    // Use follow-up date if available, otherwise use creation date
    const scheduleDate = prescription.followUpDate || prescription.createdAt;
    const timeString = new Date(scheduleDate).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Determine consultation type
    let consultationType = 'Follow-up';
    if (!prescription.followUpDate) {
      consultationType = 'New Consultation';
    } else if (prescription.diagnosis?.toLowerCase().includes('follow')) {
      consultationType = 'Follow-up';
    } else {
      consultationType = 'Consultation';
    }

    return {
      id: prescription._id,
      patientName: patientName,
      reason: prescription.diagnosis || consultationType,
      consultationType: consultationType,
      time: timeString,
      prescriptionNumber: prescription.prescriptionNumber
    };
  });

  // Sort by time
  schedule.sort((a, b) => {
    const timeA = a.time;
    const timeB = b.time;
    return timeA.localeCompare(timeB);
  });

  return {
    schedule,
    date: today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
};

