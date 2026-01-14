const HealthHistory = require('../../models/HealthHistory.model');
const Patient = require('../../models/Patient.model');
const Doctor = require('../../models/Doctor.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');

// Get all health histories for a patient
exports.getHealthHistories = async (patientId, query = {}) => {
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

  // Filter by doctor if provided
  if (query.doctorId) {
    if (!mongoose.Types.ObjectId.isValid(query.doctorId)) {
      throw new AppError('Invalid doctor ID format', 400);
    }
    filter.doctor = query.doctorId;
  }

  // Search by description
  if (query.search) {
    filter.description = { $regex: query.search, $options: 'i' };
  }

  // Get health histories with pagination
  const healthHistories = await HealthHistory.find(filter)
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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email role'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await HealthHistory.countDocuments(filter);

  logger.info('Health histories retrieved', {
    patientId,
    count: healthHistories.length,
    total,
    page,
    limit
  });

  return {
    healthHistories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get health history by ID
exports.getHealthHistoryById = async (patientId, healthHistoryId) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(healthHistoryId)) {
    throw new AppError('Invalid health history ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Get health history
  const healthHistory = await HealthHistory.findOne({
    _id: healthHistoryId,
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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email role'
    })
    .lean();

  if (!healthHistory) {
    throw new AppError('Health history not found', 404);
  }

  logger.info('Health history retrieved by ID', {
    patientId,
    healthHistoryId
  });

  return healthHistory;
};

// Create health history
exports.createHealthHistory = async (patientId, data, createdById) => {
  // Validate patientId
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }

  const { doctor, description } = data;

  // Validate doctor ID
  if (!mongoose.Types.ObjectId.isValid(doctor)) {
    throw new AppError('Invalid doctor ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Verify doctor exists
  const doctorDoc = await Doctor.findById(doctor);
  if (!doctorDoc) {
    throw new AppError('Doctor not found', 404);
  }

  // Create health history
  const healthHistory = await HealthHistory.create({
    patient: patientId,
    doctor: doctor,
    description: description.trim(),
    createdBy: createdById
  });

  // Populate and return
  const populatedHistory = await HealthHistory.findById(healthHistory._id)
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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email role'
    })
    .lean();

  logger.info('Health history created successfully', {
    patientId,
    healthHistoryId: healthHistory._id,
    doctorId: doctor,
    createdBy: createdById
  });

  return populatedHistory;
};

// Update health history
exports.updateHealthHistory = async (patientId, healthHistoryId, data) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(healthHistoryId)) {
    throw new AppError('Invalid health history ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Find health history
  const healthHistory = await HealthHistory.findOne({
    _id: healthHistoryId,
    patient: patientId
  });

  if (!healthHistory) {
    throw new AppError('Health history not found', 404);
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
    healthHistory.doctor = data.doctor;
  }

  if (data.description !== undefined) {
    healthHistory.description = data.description.trim();
  }

  await healthHistory.save();

  // Populate and return
  const populatedHistory = await HealthHistory.findById(healthHistory._id)
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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email role'
    })
    .lean();

  logger.info('Health history updated successfully', {
    patientId,
    healthHistoryId,
    updatedFields: Object.keys(data)
  });

  return populatedHistory;
};

// Delete health history
exports.deleteHealthHistory = async (patientId, healthHistoryId) => {
  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    throw new AppError('Invalid patient ID format', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(healthHistoryId)) {
    throw new AppError('Invalid health history ID format', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Find and delete health history
  const healthHistory = await HealthHistory.findOneAndDelete({
    _id: healthHistoryId,
    patient: patientId
  });

  if (!healthHistory) {
    throw new AppError('Health history not found', 404);
  }

  logger.info('Health history deleted successfully', {
    patientId,
    healthHistoryId
  });

  return { message: 'Health history deleted successfully' };
};

