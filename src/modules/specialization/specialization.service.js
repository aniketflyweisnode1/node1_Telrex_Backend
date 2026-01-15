const Specialization = require('../../models/Specialization.model');
const Doctor = require('../../models/Doctor.model');
const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');

/**
 * Get all specializations (public)
 * @param {object} query - Query parameters (page, limit, search, isActive)
 * @returns {Promise<object>} Specializations with pagination
 */
exports.getSpecializations = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive
  } = query;

  // Build filter
  const filter = {};

  // Active filter (default to only active if not specified)
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true' || isActive === true;
  } else {
    filter.isActive = true; // Default to active only
  }

  // Search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Get specializations
  const specializations = await Specialization.find(filter)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .sort({ name: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count
  const total = await Specialization.countDocuments(filter);

  return {
    specializations,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get specialization by ID (public)
 * @param {string} specializationId - Specialization ID
 * @returns {Promise<object>} Specialization details
 */
exports.getSpecializationById = async (specializationId) => {
  if (!mongoose.Types.ObjectId.isValid(specializationId)) {
    throw new AppError('Invalid specialization ID format', 400);
  }

  const specialization = await Specialization.findById(specializationId)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .lean();

  if (!specialization) {
    throw new AppError('Specialization not found', 404);
  }

  return specialization;
};

/**
 * Create specialization (admin only)
 * @param {string} adminId - Admin user ID
 * @param {object} data - Specialization data
 * @returns {Promise<object>} Created specialization
 */
exports.createSpecialization = async (adminId, data) => {
  const { name, description, isActive } = data;

  // Check if specialization with same name already exists
  const existing = await Specialization.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') }
  });

  if (existing) {
    throw new AppError('Specialization with this name already exists', 400);
  }

  const specialization = await Specialization.create({
    name: name.trim(),
    description: description ? description.trim() : undefined,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: adminId
  });

  return await Specialization.findById(specialization._id)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .lean();
};

/**
 * Update specialization (admin only)
 * @param {string} specializationId - Specialization ID
 * @param {object} data - Update data
 * @returns {Promise<object>} Updated specialization
 */
exports.updateSpecialization = async (specializationId, data) => {
  if (!mongoose.Types.ObjectId.isValid(specializationId)) {
    throw new AppError('Invalid specialization ID format', 400);
  }

  const specialization = await Specialization.findById(specializationId);
  if (!specialization) {
    throw new AppError('Specialization not found', 404);
  }

  const { name, description, isActive } = data;

  // Check if name is being changed and if new name already exists
  if (name && name.trim() !== specialization.name) {
    const existing = await Specialization.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: specializationId }
    });

    if (existing) {
      throw new AppError('Specialization with this name already exists', 400);
    }
    specialization.name = name.trim();
  }

  if (description !== undefined) {
    specialization.description = description ? description.trim() : undefined;
  }

  if (isActive !== undefined) {
    specialization.isActive = isActive;
  }

  await specialization.save();

  return await Specialization.findById(specialization._id)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .lean();
};

/**
 * Change specialization status (active/inactive) (admin only)
 * @param {string} specializationId - Specialization ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<object>} Updated specialization
 */
exports.changeSpecializationStatus = async (specializationId, isActive) => {
  if (!mongoose.Types.ObjectId.isValid(specializationId)) {
    throw new AppError('Invalid specialization ID format', 400);
  }

  const specialization = await Specialization.findById(specializationId);
  if (!specialization) {
    throw new AppError('Specialization not found', 404);
  }

  // If trying to deactivate, check if any active doctors are using it
  if (isActive === false) {
    const activeDoctorsCount = await Doctor.countDocuments({
      specialization: specializationId,
      isActive: true,
      status: 'active'
    });

    if (activeDoctorsCount > 0) {
      throw new AppError(
        `Cannot deactivate specialization. ${activeDoctorsCount} active doctor(s) are using this specialization. Please update or deactivate those doctors first.`,
        400
      );
    }
  }

  specialization.isActive = isActive;
  await specialization.save();

  return await Specialization.findById(specialization._id)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .lean();
};

/**
 * Delete specialization (admin only)
 * @param {string} specializationId - Specialization ID
 * @returns {Promise<object>} Deletion result
 */
exports.deleteSpecialization = async (specializationId) => {
  if (!mongoose.Types.ObjectId.isValid(specializationId)) {
    throw new AppError('Invalid specialization ID format', 400);
  }

  const specialization = await Specialization.findById(specializationId);
  if (!specialization) {
    throw new AppError('Specialization not found', 404);
  }

  // Check if any doctor is using this specialization
  const doctorsCount = await Doctor.countDocuments({
    specialization: specializationId
  });

  if (doctorsCount > 0) {
    throw new AppError(
      `Cannot delete specialization. ${doctorsCount} doctor(s) are using this specialization. Please update or remove those doctors first.`,
      400
    );
  }

  await Specialization.findByIdAndDelete(specializationId);

  return {
    message: 'Specialization deleted successfully',
    id: specializationId
  };
};

