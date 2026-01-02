const PastMedication = require('../../models/PastMedication.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get all past medications
exports.getAllPastMedications = async (userId) => {
  const patient = await getPatient(userId);
  
  const medications = await PastMedication.find({ patient: patient._id })
    .sort({ issueDate: -1 })
    .lean();
  
  return medications.map((med, index) => ({
    ...med,
    recordNumber: index + 1
  }));
};

// Get single past medication by ID
exports.getPastMedicationById = async (userId, recordId) => {
  const patient = await getPatient(userId);
  
  const medication = await PastMedication.findOne({
    _id: recordId,
    patient: patient._id
  });
  
  if (!medication) {
    throw new AppError('Record not found', 404);
  }
  
  return medication;
};

// Add new past medication record
exports.addPastMedication = async (userId, data) => {
  const patient = await getPatient(userId);
  
  const pastMedication = await PastMedication.create({
    patient: patient._id,
    doctor: data.doctor,
    issueDate: data.issueDate,
    prescribedMedications: data.prescribedMedications,
    clinic: data.clinic,
    diagnosedCondition: data.diagnosedCondition,
    note: data.note
  });
  
  return pastMedication;
};

// Remove past medication record
exports.removePastMedication = async (userId, recordId) => {
  const patient = await getPatient(userId);
  
  const pastMedication = await PastMedication.findOne({
    _id: recordId,
    patient: patient._id
  });
  
  if (!pastMedication) {
    throw new AppError('Record not found', 404);
  }
  
  await PastMedication.deleteOne({ _id: recordId });
  
  return { message: 'Record removed successfully' };
};

// Update past medication record
exports.updatePastMedication = async (userId, recordId, data) => {
  const patient = await getPatient(userId);
  
  const pastMedication = await PastMedication.findOneAndUpdate(
    { _id: recordId, patient: patient._id },
    {
      doctor: data.doctor,
      issueDate: data.issueDate,
      prescribedMedications: data.prescribedMedications,
      clinic: data.clinic,
      diagnosedCondition: data.diagnosedCondition,
      note: data.note
    },
    { new: true, runValidators: true }
  );
  
  if (!pastMedication) {
    throw new AppError('Record not found', 404);
  }
  
  return pastMedication;
};

