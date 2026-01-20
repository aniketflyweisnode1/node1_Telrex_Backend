const IntakeForm = require('../../models/IntakeForm.model');
const Patient = require('../../models/Patient.model');
const Doctor = require('../../models/Doctor.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get patient from userId - create if doesn't exist
const getPatient = async (userId) => {
  let patient = await Patient.findOne({ user: userId });
  if (!patient) {
    // Create patient profile if it doesn't exist
    patient = await Patient.create({ user: userId, isActive: true });
  }
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
  
  // Handle preferred pharmacy - single object (not array)
  let preferredPharmacy = null;
  
  // Get existing pharmacy if form exists
  if (intakeForm?.medicalQuestions?.preferredPharmacy) {
    preferredPharmacy = { ...intakeForm.medicalQuestions.preferredPharmacy };
  }
  
  // Handle single pharmacy entry form (like image) - "Add" field or individual fields
  if (data.addPharmacy || data.add || data.pharmacyName || data.address) {
    // Both addPharmacy and pharmacyName are recommended/required
    const pharmacyNameFromAdd = data.addPharmacy ? String(data.addPharmacy).trim() : (data.add ? String(data.add).trim() : '');
    const pharmacyNameFromField = data.pharmacyName ? String(data.pharmacyName).trim() : '';
    
    // Use addPharmacy first, then pharmacyName, but both should ideally be present
    const pharmacyName = pharmacyNameFromAdd || pharmacyNameFromField;
    const address = data.address ? String(data.address).trim() : '';
    
    // Validate that at least one name field is provided
    if (!pharmacyNameFromAdd && !pharmacyNameFromField) {
      logger.warn('Pharmacy name missing - both addPharmacy and pharmacyName are empty', {
        addPharmacy: data.addPharmacy,
        pharmacyName: data.pharmacyName
      });
      // Keep existing pharmacy if name is missing
    } else {
      // Log for debugging
      logger.info('Processing single pharmacy entry', {
        addPharmacy: data.addPharmacy,
        pharmacyName: data.pharmacyName,
        resolvedPharmacyName: pharmacyName,
        address: address,
        hasPharmacyName: !!pharmacyName,
        hasAddress: !!address
      });
      
      // Save if pharmacy name is provided (address is optional)
      if (pharmacyName) {
        preferredPharmacy = {
          addPharmacy: pharmacyNameFromAdd || '',
          pharmacyName: pharmacyName || '',
          address: address || '',
          city: data.city ? String(data.city).trim() : '',
          state: data.state ? String(data.state).trim() : '',
          zip: data.zip ? String(data.zip).trim() : ''
        };
        logger.info('Single pharmacy saved successfully', { pharmacyName: preferredPharmacy.pharmacyName, address: preferredPharmacy.address });
      } else {
        logger.warn('Pharmacy not saved - pharmacy name is required', { addPharmacy: data.addPharmacy, pharmacyName: data.pharmacyName, address: data.address });
        // Keep existing pharmacy if new data is invalid
      }
    }
  }
  // If no pharmacy data provided, keep existing pharmacy
  
  // Build medical questions data
  // If arrays are provided in request, use them (even if empty), otherwise keep existing
  const medicalQuestionsData = {
    pastMedicalHistory: Array.isArray(data.pastMedicalHistory) 
      ? data.pastMedicalHistory 
      : (intakeForm?.medicalQuestions?.pastMedicalHistory || []),
    currentMedications: Array.isArray(data.currentMedications) 
      ? data.currentMedications 
      : (intakeForm?.medicalQuestions?.currentMedications || []),
    medicationAllergies: Array.isArray(data.medicationAllergies) 
      ? data.medicationAllergies 
      : (intakeForm?.medicalQuestions?.medicationAllergies || []),
    preferredPharmacy: preferredPharmacy,
    howDidYouHearAboutUs: data.howDidYouHearAboutUs !== undefined 
      ? (data.howDidYouHearAboutUs || '') 
      : (intakeForm?.medicalQuestions?.howDidYouHearAboutUs || '')
  };
  
  // Check if required fields are present (at least one should be filled)
  const hasData = medicalQuestionsData.pastMedicalHistory?.length > 0 || 
                  medicalQuestionsData.currentMedications?.length > 0 || 
                  medicalQuestionsData.medicationAllergies?.length > 0 ||
                  (medicalQuestionsData.preferredPharmacy && (medicalQuestionsData.preferredPharmacy.pharmacyName || medicalQuestionsData.preferredPharmacy.address)) ||
                  medicalQuestionsData.howDidYouHearAboutUs;
  
  medicalQuestionsData.isMedicalQuestionsComplete = hasData;
  
  if (!intakeForm) {
    intakeForm = await IntakeForm.create({ 
      patient: patient._id, 
      medicalQuestions: medicalQuestionsData 
    });
  } else {
    intakeForm.medicalQuestions = medicalQuestionsData;
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

  // Validate and verify doctor ID if provided (optional)
  if (doctorId) {
    // Verify doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new AppError('Doctor not found.', 404);
    }

    if (!doctor.isActive || doctor.status !== 'active') {
      throw new AppError('Selected doctor is not available for consultations.', 400);
    }
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

  // Update status to submitted and assign doctor (if provided)
  intakeForm.status = 'submitted';
  if (doctorId) {
    intakeForm.doctor = doctorId;
  }
  // If doctorId is not provided, doctor field remains null/unchanged
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

