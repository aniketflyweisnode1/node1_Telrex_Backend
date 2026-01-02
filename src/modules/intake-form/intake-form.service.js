const IntakeForm = require('../../models/IntakeForm.model');
const Patient = require('../../models/Patient.model');
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
  let intakeForm = await IntakeForm.findOne({ patient: patient._id });
  
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
  
  return intakeForm;
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
  
  return intakeForm;
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
  
  return intakeForm;
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
  
  return intakeForm;
};

