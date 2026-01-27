const medicineService = require('./medicine.service');
const healthService = require('../health/health.service');
const path = require('path');

// Bulk add medicines from JSON payload
exports.bulkUploadMedicinesFromJson = async (req, res, next) => {
  try {
    const medicinesPayload = req.body.medicines || req.body.data || req.body.items || [];
    const medicines = await medicineService.bulkAddMedicinesFromJson(medicinesPayload);

    res.status(201).json({
      success: true,
      message: 'Medicines added successfully from JSON payload',
      data: medicines
    });
  } catch (err) {
    next(err);
  }
};

// Add new medicine
exports.addMedicine = async (req, res, next) => {
  try {
    const files = req.files || [];
    const medicine = await medicineService.addMedicine(req.body, files, req);
    
    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Add new medicine and mark as best offer
exports.addBestMedicine = async (req, res, next) => {
  try {
    const files = req.files || [];
    const userId = req.user ? req.user.id : null;
    
    // Add the medicine first
    const medicine = await medicineService.addMedicine(req.body, files, req);
    
    // Mark as best offer with optional discount percentage
    const discountData = req.body.discountPercentage !== undefined 
      ? { discountPercentage: req.body.discountPercentage } 
      : null;
    
    const bestMedicine = await healthService.markMedicineAsBestOffer(
      medicine._id.toString(), 
      discountData, 
      userId
    );
    
    res.status(201).json({
      success: true,
      message: 'Medicine added and marked as best offer successfully',
      data: bestMedicine
    });
  } catch (err) {
    next(err);
  }
};

// Get all medicines
exports.getAllMedicines = async (req, res, next) => {
  try {
    const result = await medicineService.getAllMedicines(req.query);
    res.status(200).json({
      success: true,
      data: result.medicines,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get medicine by ID
exports.getMedicineById = async (req, res, next) => {
  try {
    const medicine = await medicineService.getMedicineById(req.params.id);
    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Find similar medicines
exports.findSimilarMedicines = async (req, res, next) => {
  try {
    const result = await medicineService.findSimilarMedicines(req.params.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Similar medicines retrieved successfully',
      data: result.medicines,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Update medicine
exports.updateMedicine = async (req, res, next) => {
  try {
    const files = req.files || [];
    const medicine = await medicineService.updateMedicine(req.params.id, req.body, files, req);
    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Update medicine stock and status
exports.updateMedicineStockStatus = async (req, res, next) => {
  try {
    const medicine = await medicineService.updateMedicineStockStatus(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Medicine stock and status updated successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Update medicine visibility
exports.updateMedicineVisibility = async (req, res, next) => {
  try {
    const { visibility } = req.body;
    const medicine = await medicineService.updateMedicineVisibility(req.params.id, visibility);
    res.status(200).json({
      success: true,
      message: 'Medicine visibility updated successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res, next) => {
  try {
    const result = await medicineService.deleteMedicine(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

