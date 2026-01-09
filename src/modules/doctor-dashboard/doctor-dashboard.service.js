const Doctor = require('../../models/Doctor.model');
const Prescription = require('../../models/Prescription.model');
const IntakeForm = require('../../models/IntakeForm.model');
const Chat = require('../../models/Chat.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');

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

  // Total Consultations (count of prescriptions)
  const totalConsultationsFilter = { doctor: doctorId };
  if (Object.keys(dateFilter).length > 0) {
    totalConsultationsFilter.createdAt = dateFilter;
  }
  const totalConsultations = await Prescription.countDocuments(totalConsultationsFilter);

  // Calculate percentage change for consultations
  let consultationsChange = 0;
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
      default:
        previousPeriodStart = null;
        previousPeriodEnd = null;
    }

    if (previousPeriodStart && previousPeriodEnd) {
      const previousConsultations = await Prescription.countDocuments({
        doctor: doctorId,
        createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
      });

      if (previousConsultations > 0) {
        consultationsChange = ((totalConsultations - previousConsultations) / previousConsultations) * 100;
      } else if (totalConsultations > 0) {
        consultationsChange = 100;
      }
    }
  }

  // Prescriptions Issued (same as consultations, but can be filtered differently)
  const prescriptionsIssued = totalConsultations;

  // Patient Rating (from doctor profile)
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
        change: consultationsChange > 0 ? `+${consultationsChange.toFixed(1)}%` : consultationsChange < 0 ? `${consultationsChange.toFixed(1)}%` : '0%',
        trend: consultationsChange >= 0 ? 'up' : 'down'
      },
      patientRating: {
        value: patientRating,
        totalRatings: totalRatings
      }
    }
  };
};

// Get recent consultations
exports.getRecentConsultations = async (userId, query = {}) => {
  const doctor = await getDoctor(userId);
  const doctorId = doctor._id;

  const limit = parseInt(query.limit) || 10;
  const page = parseInt(query.page) || 1;
  const skip = (page - 1) * limit;

  // Get recent intake forms (consultation requests) assigned to this doctor
  const intakeForms = await IntakeForm.find({ 
    doctor: doctorId,
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

  // Format consultations
  const consultations = intakeForms.map(intakeForm => {
    const patient = intakeForm.patient?.user;
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
      intakeFormId: intakeForm._id
    };
  });

  return {
    consultations,
    pagination: {
      page,
      limit,
      total: await IntakeForm.countDocuments({ 
        doctor: doctorId,
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

