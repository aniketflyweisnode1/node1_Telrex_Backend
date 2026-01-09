const IntakeForm = require('../../models/IntakeForm.model');
const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const Doctor = require('../../models/Doctor.model');
const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');

// Get doctor from userId
const getDoctor = async (userId) => {
  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) {
    throw new AppError('Doctor profile not found. Please contact an administrator to create your doctor profile.', 404);
  }
  return doctor;
};

// Get all patient consultations (intake forms)
exports.getConsultations = async (userId, query = {}) => {
  // Token se doctor ko identify karo
  const doctor = await getDoctor(userId); // Verify doctor exists and get doctor ID
  const doctorId = doctor._id; // Doctor ka ObjectId

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter - sirf us doctor ke consultations dikhao jinke paas intake form aaya hai
  const filter = {
    doctor: doctorId // Is doctor ke saath linked consultations
  };

  // Filter by status
  if (query.status) {
    if (query.status === 'pending') {
      filter.status = 'submitted'; // Pending = submitted but not reviewed
    } else {
      filter.status = query.status;
    }
  } else {
    // Default: show submitted (pending) consultations
    filter.status = 'submitted';
  }

  // Search by patient name or condition/symptoms
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    
    // Get users matching the search
    const matchingUsers = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    }).distinct('_id');

    // Get patients for matching users
    const patients = await Patient.find({
      user: { $in: matchingUsers }
    }).distinct('_id');

    // Also search in medical questions (symptoms, conditions) and basic information
    // Important: Search me bhi doctor filter lagao taaki sirf is doctor ke consultations search ho
    const intakeFormsByMedical = await IntakeForm.find({
      doctor: doctorId, // Doctor filter bhi lagao
      $or: [
        { 'medicalQuestions.pastMedicalHistory': searchRegex },
        { 'medicalQuestions.currentMedications': searchRegex },
        { 'basicInformation.firstName': searchRegex },
        { 'basicInformation.lastName': searchRegex },
        { 'basicInformation.email': searchRegex }
      ]
    }).distinct('patient');

    // Combine all patient IDs
    const allPatientIds = [...new Set([...patients, ...intakeFormsByMedical])];
    
    if (allPatientIds.length > 0) {
      filter.patient = { $in: allPatientIds };
    } else {
      // If no matches, return empty result
      filter.patient = { $in: [] };
    }
  }

  // Get consultations with patient and doctor information
  const consultations = await IntakeForm.find(filter)
    .populate({
      path: 'patient',
      select: 'user dateOfBirth gender bloodGroup height weight medicalHistory allergies emergencyContact profilePicture',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    })
    .populate({
      path: 'doctor',
      select: 'user specialty',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  // Format consultations
  const formattedConsultations = consultations.map(form => {
    const patient = form.patient?.user;
    const patientName = patient 
      ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() 
      : 'Unknown Patient';
    
    // Calculate age from dateOfBirth (check both patient model and basicInformation)
    let age = null;
    const dateOfBirth = form.patient?.dateOfBirth || form.basicInformation?.dateOfBirth;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Get condition/symptoms from medical questions
    const condition = form.medicalQuestions?.pastMedicalHistory?.join(', ') || 
                     form.medicalQuestions?.currentMedications?.join(', ') || 
                     'Not specified';
    
    const symptoms = form.medicalQuestions?.pastMedicalHistory?.slice(0, 2).join(', ') || 
                    'No symptoms listed';

    // Format submitted date
    const submittedDate = new Date(form.createdAt);
    const formattedDate = submittedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = submittedDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      id: form._id,
      patient: {
        id: form.patient?._id,
        name: patientName,
        age: age,
        gender: form.patient?.gender || form.basicInformation?.sex || 'Not specified',
        email: patient?.email || form.basicInformation?.email,
        phone: patient?.phoneNumber || form.basicInformation?.phone,
        countryCode: patient?.countryCode || '+91',
        profilePicture: patient?.profilePicture || null
      },
      condition: condition,
      symptoms: symptoms,
      status: form.status === 'submitted' ? 'pending' : form.status,
      submittedAt: `${formattedDate} ${formattedTime}`,
      submittedDate: form.createdAt,
      intakeForm: {
        basicInfoComplete: form.basicInformation?.isBasicInfoComplete || false,
        emergencyContactComplete: form.emergencyContact?.isEmergencyContactComplete || false,
        medicalQuestionsComplete: form.medicalQuestions?.isMedicalQuestionsComplete || false
      }
    };
  });

  const total = await IntakeForm.countDocuments(filter);

  // Add doctor information to formatted consultations
  formattedConsultations.forEach((consultation, index) => {
    const form = consultations[index];
    if (form?.doctor) {
      consultation.doctor = {
        id: form.doctor._id,
        name: form.doctor.user 
          ? `${form.doctor.user.firstName || ''} ${form.doctor.user.lastName || ''}`.trim()
          : 'Unknown Doctor',
        specialty: form.doctor.specialty
      };
    }
  });

  return {
    consultations: formattedConsultations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get consultation by ID (detailed intake form)
exports.getConsultationById = async (userId, consultationId) => {
  // Token se doctor ko identify karo
  const doctor = await getDoctor(userId); // Verify doctor exists and get doctor ID
  const doctorId = doctor._id;

  // Consultation ko find karo aur verify karo ki ye is doctor ki hai
  const intakeForm = await IntakeForm.findOne({
    _id: consultationId,
    doctor: doctorId // Important: Verify consultation belongs to this doctor
  })
    .populate({
      path: 'patient',
      select: 'user dateOfBirth gender bloodGroup height weight medicalHistory allergies emergencyContact profilePicture',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    })
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber consultationFee status rating experience education certifications languages availability address',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    })
    .lean();

  if (!intakeForm) {
    throw new AppError('Consultation not found or you do not have access to this consultation', 404);
  }

  const patient = intakeForm.patient?.user;
  const patientName = patient 
    ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() 
    : 'Unknown Patient';

  // Calculate age (check both patient model and basicInformation)
  let age = null;
  const dateOfBirth = intakeForm.patient?.dateOfBirth || intakeForm.basicInformation?.dateOfBirth;
  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Format submitted date
  const submittedDate = new Date(intakeForm.createdAt);
  const formattedDate = submittedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formattedTime = submittedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return {
    id: intakeForm._id,
    patient: {
      id: intakeForm.patient?._id,
      name: patientName,
      firstName: patient?.firstName || intakeForm.basicInformation?.firstName,
      lastName: patient?.lastName || intakeForm.basicInformation?.lastName,
      age: age,
      gender: intakeForm.patient?.gender || intakeForm.basicInformation?.sex || 'Not specified',
      dateOfBirth: intakeForm.patient?.dateOfBirth || intakeForm.basicInformation?.dateOfBirth,
      email: patient?.email || intakeForm.basicInformation?.email,
      phone: patient?.phoneNumber || intakeForm.basicInformation?.phone,
      countryCode: patient?.countryCode || '+91',
      profilePicture: patient?.profilePicture || null,
      bloodGroup: intakeForm.patient?.bloodGroup,
      height: intakeForm.patient?.height,
      weight: intakeForm.patient?.weight,
      medicalHistory: intakeForm.patient?.medicalHistory || [],
      allergies: intakeForm.patient?.allergies || [],
      emergencyContact: intakeForm.patient?.emergencyContact || intakeForm.emergencyContact
    },
    basicInformation: intakeForm.basicInformation || {},
    emergencyContact: intakeForm.emergencyContact || {},
    medicalQuestions: intakeForm.medicalQuestions || {},
    doctor: intakeForm.doctor ? {
      id: intakeForm.doctor._id,
      name: intakeForm.doctor.user 
        ? `${intakeForm.doctor.user.firstName || ''} ${intakeForm.doctor.user.lastName || ''}`.trim()
        : 'Unknown Doctor',
      specialty: intakeForm.doctor.specialty,
      licenseNumber: intakeForm.doctor.licenseNumber,
      consultationFee: intakeForm.doctor.consultationFee,
      rating: intakeForm.doctor.rating,
      experience: intakeForm.doctor.experience
    } : null,
    status: intakeForm.status === 'submitted' ? 'pending' : intakeForm.status,
    submittedAt: `${formattedDate} ${formattedTime}`,
    submittedDate: intakeForm.createdAt,
    updatedAt: intakeForm.updatedAt
  };
};

// Update consultation status
exports.updateConsultationStatus = async (userId, consultationId, status) => {
  // Token se doctor ko identify karo
  const doctor = await getDoctor(userId); // Verify doctor exists and get doctor ID
  const doctorId = doctor._id;

  const validStatuses = ['draft', 'submitted', 'reviewed'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status. Must be one of: draft, submitted, reviewed', 400);
  }

  // Update karte waqt verify karo ki consultation is doctor ki hai
  const intakeForm = await IntakeForm.findOneAndUpdate(
    {
      _id: consultationId,
      doctor: doctorId // Important: Only update if consultation belongs to this doctor
    },
    { status },
    { new: true, runValidators: true }
  )
    .populate({
      path: 'patient',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .populate({
      path: 'doctor',
      select: 'user specialty',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    });

  if (!intakeForm) {
    throw new AppError('Consultation not found or you do not have access to update this consultation', 404);
  }

  return {
    id: intakeForm._id,
    status: intakeForm.status === 'submitted' ? 'pending' : intakeForm.status,
    updatedAt: intakeForm.updatedAt
  };
};

