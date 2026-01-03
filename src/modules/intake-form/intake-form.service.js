const IntakeForm = require('../../models/IntakeForm.model');
const Patient = require('../../models/Patient.model');
const Doctor = require('../../models/Doctor.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get intake form
exports.getIntakeForm = async (userId) => {
  const patient = await getPatient(userId);
  let intakeForm = await IntakeForm.findOne({ patient: patient._id })
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber consultationFee status rating experience education certifications languages availability address',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    });
  
  if (!intakeForm) {
    intakeForm = await IntakeForm.create({ patient: patient._id });
  }
  
  return intakeForm;
};

// Save Basic Information
exports.saveBasicInformation = async (userId, data) => {
  const patient = await getPatient(userId);
  let intakeForm = await IntakeForm.findOne({ patient: patient._id });
  
  // Check if required fields are present
  const requiredFields = ['firstName', 'lastName', 'sex', 'dateOfBirth', 'email', 'phone', 'address', 'city', 'state', 'zip'];
  const isComplete = requiredFields.every(field => data[field] !== undefined && data[field] !== null && data[field] !== '');
  
  const basicInfoData = {
    ...data,
    isBasicInfoComplete: isComplete
  };
  
  if (!intakeForm) {
    intakeForm = await IntakeForm.create({ 
      patient: patient._id, 
      basicInformation: basicInfoData 
    });
  } else {
    intakeForm.basicInformation = {
      ...intakeForm.basicInformation,
      ...basicInfoData
    };
    await intakeForm.save();
  }
  
  // Populate doctor before returning
  return await IntakeForm.findById(intakeForm._id)
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber consultationFee status rating experience education certifications languages availability address',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    });
};

// Save Emergency Contact
exports.saveEmergencyContact = async (userId, data) => {
  const patient = await getPatient(userId);
  let intakeForm = await IntakeForm.findOne({ patient: patient._id });
  
  // Check if required fields are present
  const requiredFields = ['relationship', 'firstName', 'lastName', 'phone', 'address', 'city', 'state', 'zip'];
  const isComplete = requiredFields.every(field => data[field] !== undefined && data[field] !== null && data[field] !== '');
  
  const emergencyContactData = {
    ...data,
    isEmergencyContactComplete: isComplete
  };
  
  if (!intakeForm) {
    intakeForm = await IntakeForm.create({ 
      patient: patient._id, 
      emergencyContact: emergencyContactData 
    });
  } else {
    intakeForm.emergencyContact = {
      ...intakeForm.emergencyContact,
      ...emergencyContactData
    };
    await intakeForm.save();
  }
  
  // Populate doctor before returning
  return await IntakeForm.findById(intakeForm._id)
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber consultationFee status rating experience education certifications languages availability address',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    });
};

// Save Medical Questions
exports.saveMedicalQuestions = async (userId, data) => {
  const patient = await getPatient(userId);
  let intakeForm = await IntakeForm.findOne({ patient: patient._id });
  
  // Check if required fields are present (at least one should be filled)
  const hasData = data.pastMedicalHistory?.length > 0 || 
                  data.currentMedications?.length > 0 || 
                  data.medicationAllergies?.length > 0 ||
                  data.preferredPharmacies?.length > 0 ||
                  data.howDidYouHearAboutUs;
  
  const medicalQuestionsData = {
    ...data,
    isMedicalQuestionsComplete: hasData
  };
  
  if (!intakeForm) {
    intakeForm = await IntakeForm.create({ 
      patient: patient._id, 
      medicalQuestions: medicalQuestionsData 
    });
  } else {
    intakeForm.medicalQuestions = {
      ...intakeForm.medicalQuestions,
      ...medicalQuestionsData
    };
    await intakeForm.save();
  }
  
  // Populate doctor before returning
  return await IntakeForm.findById(intakeForm._id)
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber consultationFee status rating experience education certifications languages availability address',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    });
};

// Submit consultation (book consultation)
exports.submitConsultation = async (userId, doctorId) => {
  const patient = await getPatient(userId);
  const intakeForm = await IntakeForm.findOne({ patient: patient._id });
  
  if (!intakeForm) {
    throw new AppError('Intake form not found. Please complete the intake form first.', 404);
  }

  // Validate doctor ID
  if (!doctorId) {
    throw new AppError('Doctor ID is required to submit consultation.', 400);
  }

  // Verify doctor exists and is active
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new AppError('Doctor not found.', 404);
  }

  if (!doctor.isActive || doctor.status !== 'active') {
    throw new AppError('Selected doctor is not available for consultations.', 400);
  }

  // Check if all required sections are complete
  const isComplete = 
    intakeForm.basicInformation?.isBasicInfoComplete &&
    intakeForm.emergencyContact?.isEmergencyContactComplete &&
    intakeForm.medicalQuestions?.isMedicalQuestionsComplete;

  if (!isComplete) {
    throw new AppError('Please complete all sections of the intake form before submitting.', 400);
  }

  // Check if already submitted
  if (intakeForm.status === 'submitted') {
    throw new AppError('Consultation has already been submitted.', 400);
  }

  // Update status to submitted and assign doctor
  intakeForm.status = 'submitted';
  intakeForm.doctor = doctorId;
  await intakeForm.save();

  // Populate doctor information before returning
  const populatedForm = await IntakeForm.findById(intakeForm._id)
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber consultationFee status rating experience education certifications languages availability address',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    })
    .populate({
      path: 'patient',
      select: 'user dateOfBirth gender',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber'
      }
    });

  return populatedForm;
};

// Create/Update intake form (legacy - for backward compatibility)
exports.saveIntakeForm = async (userId, data) => {
  const patient = await getPatient(userId);
  let intakeForm = await IntakeForm.findOne({ patient: patient._id });
  
  if (!intakeForm) {
    intakeForm = await IntakeForm.create({ patient: patient._id, ...data });
  } else {
    intakeForm = await IntakeForm.findByIdAndUpdate(
      intakeForm._id,
      { ...data, status: data.status || intakeForm.status },
      { new: true, runValidators: true }
    );
  }
  
  // Populate doctor before returning
  return await IntakeForm.findById(intakeForm._id)
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber consultationFee status rating experience education certifications languages availability address',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber countryCode profilePicture'
      }
    });
};

