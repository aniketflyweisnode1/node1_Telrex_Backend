const specializationService = require('./specialization.service');

/**
 * Get all specializations (public)
 */
exports.getSpecializations = async (req, res, next) => {
  try {
    const result = await specializationService.getSpecializations(req.query);

    res.status(200).json({
      success: true,
      message: 'Specializations retrieved successfully',
      data: result.specializations,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get specialization by ID (public)
 */
exports.getSpecializationById = async (req, res, next) => {
  try {
    const specialization = await specializationService.getSpecializationById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Specialization retrieved successfully',
      data: specialization
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create specialization (admin only)
 */
exports.createSpecialization = async (req, res, next) => {
  try {
    const specialization = await specializationService.createSpecialization(
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Specialization created successfully',
      data: specialization
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update specialization (admin only)
 */
exports.updateSpecialization = async (req, res, next) => {
  try {
    const specialization = await specializationService.updateSpecialization(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Specialization updated successfully',
      data: specialization
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Change specialization status (admin only)
 */
exports.changeSpecializationStatus = async (req, res, next) => {
  try {
    const specialization = await specializationService.changeSpecializationStatus(
      req.params.id,
      req.body.isActive
    );

    res.status(200).json({
      success: true,
      message: `Specialization ${specialization.isActive ? 'activated' : 'deactivated'} successfully`,
      data: specialization
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete specialization (admin only)
 */
exports.deleteSpecialization = async (req, res, next) => {
  try {
    const result = await specializationService.deleteSpecialization(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.id }
    });
  } catch (err) {
    next(err);
  }
};

