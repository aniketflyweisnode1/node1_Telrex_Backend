const adminService = require('./admin.service');
const { validationResult } = require('express-validator');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Admin registration
exports.adminRegister = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const result = await adminService.adminRegister(req.body);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin login
exports.adminLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { identifier, password } = req.body;
    const result = await adminService.adminLogin(identifier, password);

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// Create sub-admin
exports.createSubAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const subAdmin = await adminService.createSubAdmin(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Sub-admin created successfully',
      data: subAdmin
    });
  } catch (err) {
    next(err);
  }
};

// Get all sub-admins
exports.getAllSubAdmins = async (req, res, next) => {
  try {
    const result = await adminService.getAllSubAdmins(req.query);

    res.status(200).json({
      success: true,
      message: 'Sub-admins retrieved successfully',
      data: result.subAdmins,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get sub-admin by ID
exports.getSubAdminById = async (req, res, next) => {
  try {
    const subAdmin = await adminService.getSubAdminById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sub-admin retrieved successfully',
      data: subAdmin
    });
  } catch (err) {
    next(err);
  }
};

// Update sub-admin
exports.updateSubAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const subAdmin = await adminService.updateSubAdmin(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Sub-admin updated successfully',
      data: subAdmin
    });
  } catch (err) {
    next(err);
  }
};

// Delete sub-admin
exports.deleteSubAdmin = async (req, res, next) => {
  try {
    const result = await adminService.deleteSubAdmin(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Set permissions for sub-admin
exports.setPermissions = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const subAdmin = await adminService.setPermissions(req.params.id, req.body.permissions);

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: subAdmin
    });
  } catch (err) {
    next(err);
  }
};

// Get available modules
exports.getAvailableModules = async (req, res, next) => {
  try {
    const modules = await adminService.getAvailableModules();

    res.status(200).json({
      success: true,
      message: 'Available modules retrieved successfully',
      data: modules
    });
  } catch (err) {
    next(err);
  }
};

