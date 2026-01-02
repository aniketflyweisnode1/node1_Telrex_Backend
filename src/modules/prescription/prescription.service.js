const Prescription = require('../../models/Prescription.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');
const pdfGenerator = require('../../utils/pdfGenerator');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get all prescriptions for patient
exports.getPrescriptions = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const filter = { patient: patient._id };
  if (query.status) filter.status = query.status;
  
  const prescriptions = await Prescription.find(filter)
    .populate('doctor', 'firstName lastName')
    .sort({ createdAt: -1 });
  
  return prescriptions;
};

// Get single prescription
exports.getPrescriptionById = async (userId, prescriptionId) => {
  const patient = await getPatient(userId);
  
  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    patient: patient._id
  }).populate('doctor', 'firstName lastName');
  
  if (!prescription) throw new AppError('Prescription not found', 404);
  
  return prescription;
};

// Get prescription PDF
exports.getPrescriptionPDF = async (userId, prescriptionId) => {
  const prescription = await exports.getPrescriptionById(userId, prescriptionId);
  
  // Generate PDF (you'll need to implement pdfGenerator)
  const pdfUrl = await pdfGenerator.generatePrescriptionPDF(prescription);
  
  // Update prescription with PDF URL if not exists
  if (!prescription.pdfUrl) {
    prescription.pdfUrl = pdfUrl;
    await prescription.save();
  }
  
  return prescription.pdfUrl;
};

// Reorder prescription
exports.reorderPrescription = async (userId, prescriptionId) => {
  const prescription = await exports.getPrescriptionById(userId, prescriptionId);
  
  // This will be handled by order service
  return prescription;
};

