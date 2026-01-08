const medicineService = require('./medicine.service');
const path = require('path');

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

