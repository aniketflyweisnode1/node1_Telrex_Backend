const Prescription = require('../../models/Prescription.model');
const Patient = require('../../models/Patient.model');
const Doctor = require('../../models/Doctor.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');

// Get all prescriptions for a patient
exports.getPrescriptions = async (patientId, query = {}) => {
  // Validate patientId
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { patient: patientId };

  // Filter by status
  if (query.status) {
    filter.status = query.status;
  }

  // Filter by doctor
  if (query.doctorId) {
    if (!mongoose.Types.ObjectId.isValid(query.doctorId)) {
      throw new AppError('Invalid doctor ID format', 400);
    }
    filter.doctor = query.doctorId;
  }

  // Search by medicine, brand, description, or prescription number
  if (query.search) {
    filter.$or = [
      { medicine: { $regex: query.search, $options: 'i' } },
      { brand: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { prescriptionNumber: { $regex: query.search, $options: 'i' } }
    ];
  }

  // Get prescriptions with pagination
  const prescriptions = await Prescription.find(filter)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Prescription.countDocuments(filter);

  logger.info('Prescriptions retrieved', {
    patientId,
    count: prescriptions.length,
    total,
    page,
    limit
  });

  return {
    prescriptions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get prescription by ID
exports.getPrescriptionById = async (patientId, prescriptionId) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    throw new AppError('Invalid prescription ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Get prescription
  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    patient: patientId
  })
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .lean();

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  logger.info('Prescription retrieved by ID', {
    patientId,
    prescriptionId
  });

  return prescription;
};

// Create prescription
exports.createPrescription = async (patientId, data, createdById) => {
  // Validate patientId
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const { doctor, medicine, brand, description, status } = data;

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Validate and verify doctor if provided
  if (doctor) {
    if (!mongoose.Types.ObjectId.isValid(doctor)) {
      throw new AppError('Invalid doctor ID format', 400);
    }
    const doctorDoc = await Doctor.findById(doctor);
    if (!doctorDoc) {
      throw new AppError('Doctor not found', 404);
    }
  }

  // Validate required fields
  if (!medicine || !medicine.trim()) {
    throw new AppError('Medicine is required', 400);
  }
  if (!brand || !brand.trim()) {
    throw new AppError('Brand is required', 400);
  }
  if (!description || !description.trim()) {
    throw new AppError('Description is required', 400);
  }

  // Generate prescription number
  const generatePrescriptionNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PRES${timestamp}${random}`;
  };

  // Create prescription
  const prescriptionData = {
    patient: patientId,
    medicine: medicine.trim(),
    brand: brand.trim(),
    description: description.trim(),
    status: status || 'active',
    prescriptionNumber: generatePrescriptionNumber() // Generate in service to ensure it's set
  };

  // Add doctor if provided
  if (doctor) {
    prescriptionData.doctor = doctor;
  }

  // Ensure prescription number is unique
  let prescriptionNumber = prescriptionData.prescriptionNumber;
  let existing = await Prescription.findOne({ prescriptionNumber });
  let attempts = 0;
  while (existing && attempts < 5) {
    prescriptionNumber = generatePrescriptionNumber();
    existing = await Prescription.findOne({ prescriptionNumber });
    attempts++;
  }
  prescriptionData.prescriptionNumber = prescriptionNumber;

  const prescription = await Prescription.create(prescriptionData);

  // Populate and return
  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .lean();

  logger.info('Prescription created successfully', {
    patientId,
    prescriptionId: prescription._id,
    prescriptionNumber: prescription.prescriptionNumber,
    doctorId: doctor,
    createdBy: createdById
  });

  return populatedPrescription;
};

// Update prescription
exports.updatePrescription = async (patientId, prescriptionId, data) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    throw new AppError('Invalid prescription ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Find prescription
  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    patient: patientId
  });

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  // Update fields
  if (data.doctor !== undefined) {
    // Validate doctor ID
    if (!mongoose.Types.ObjectId.isValid(data.doctor)) {
      throw new AppError('Invalid doctor ID format', 400);
    }
    // Verify doctor exists
    const doctorDoc = await Doctor.findById(data.doctor);
    if (!doctorDoc) {
      throw new AppError('Doctor not found', 404);
    }
    prescription.doctor = data.doctor;
  }

  if (data.medicine !== undefined) {
    if (!data.medicine || !data.medicine.trim()) {
      throw new AppError('Medicine is required', 400);
    }
    prescription.medicine = data.medicine.trim();
  }

  if (data.brand !== undefined) {
    if (!data.brand || !data.brand.trim()) {
      throw new AppError('Brand is required', 400);
    }
    prescription.brand = data.brand.trim();
  }

  if (data.description !== undefined) {
    if (!data.description || !data.description.trim()) {
      throw new AppError('Description is required', 400);
    }
    prescription.description = data.description.trim();
  }

  if (data.status !== undefined) {
    if (!['active', 'completed', 'cancelled'].includes(data.status)) {
      throw new AppError('Status must be one of: active, completed, cancelled', 400);
    }
    prescription.status = data.status;
  }

  await prescription.save();

  // Populate and return
  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: '-password'
      }
    })
    .lean();

  logger.info('Prescription updated successfully', {
    patientId,
    prescriptionId,
    updatedFields: Object.keys(data)
  });

  return populatedPrescription;
};

// Delete prescription
exports.deletePrescription = async (patientId, prescriptionId) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    throw new AppError('Invalid prescription ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Find and delete prescription
  const prescription = await Prescription.findOneAndDelete({
    _id: prescriptionId,
    patient: patientId
  });

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  logger.info('Prescription deleted successfully', {
    patientId,
    prescriptionId
  });

  return { message: 'Prescription deleted successfully' };
};

