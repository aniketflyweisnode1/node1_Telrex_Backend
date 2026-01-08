const savedMedicineService = require('./saved-medicine.service');

// Save medicine
exports.saveMedicine = async (req, res, next) => {
  try {
    const savedMedicine = await savedMedicineService.saveMedicine(
      req.user.id,
      req.params.medicineId
    );
    
    res.status(201).json({
      success: true,
      message: 'Medicine saved successfully',
      data: savedMedicine
    });
  } catch (err) {
    next(err);
  }
};

// Unsave medicine
exports.unsaveMedicine = async (req, res, next) => {
  try {
    const result = await savedMedicineService.unsaveMedicine(
      req.user.id,
      req.params.medicineId
    );
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Get all saved medicines
exports.getSavedMedicines = async (req, res, next) => {
  try {
    const result = await savedMedicineService.getSavedMedicines(
      req.user.id,
      req.query
    );
    
    res.status(200).json({
      success: true,
      message: 'Saved medicines retrieved successfully',
      data: result.savedMedicines,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Check if medicine is saved
exports.isMedicineSaved = async (req, res, next) => {
  try {
    const result = await savedMedicineService.isMedicineSaved(
      req.user.id,
      req.params.medicineId
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

