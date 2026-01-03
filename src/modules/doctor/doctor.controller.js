const doctorService = require('./doctor.service');
const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get statistics
exports.getStatistics = async (req, res, next) => {
  try {
    const statistics = await doctorService.getStatistics();

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

// Create doctor
exports.createDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const doctor = await doctorService.createDoctor(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });
  } catch (err) {
    next(err);
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res, next) => {
  try {
    const result = await doctorService.getAllDoctors(req.query);

    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: result.doctors,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get doctor by ID
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Doctor retrieved successfully',
      data: doctor
    });
  } catch (err) {
    next(err);
  }
};

// Update doctor
exports.updateDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add verifiedBy for license verification
    if (req.body.licenseVerified === true) {
      req.body.verifiedBy = req.user.id;
    }

    // Log the doctor ID being used for update

    const doctor = await doctorService.updateDoctor(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });
  } catch (err) {
    next(err);
  }
};

// Delete doctor
exports.deleteDoctor = async (req, res, next) => {
  try {
    const result = await doctorService.deleteDoctor(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Reset doctor password
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const result = await doctorService.resetDoctorPassword(req.params.id, req.body.newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Get available specialties
exports.getAvailableSpecialties = async (req, res, next) => {
  try {
    const specialties = await doctorService.getAvailableSpecialties();

    res.status(200).json({
      success: true,
      message: 'Available specialties retrieved successfully',
      data: specialties
    });
  } catch (err) {
    next(err);
  }
};

