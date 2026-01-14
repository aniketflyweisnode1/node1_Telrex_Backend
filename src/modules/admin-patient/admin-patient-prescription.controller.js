const prescriptionService = require('./admin-patient-prescription.service');

// Get all prescriptions for a patient
exports.getPrescriptions = async (req, res, next) => {
  try {
    const result = await prescriptionService.getPrescriptions(
      req.params.id,
      req.query
    );

    res.status(200).json({
      success: true,
      message: 'Prescriptions retrieved successfully',
      data: result.prescriptions,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get prescription by ID
exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(
      req.params.id,
      req.params.prescriptionId
    );

    res.status(200).json({
      success: true,
      message: 'Prescription retrieved successfully',
      data: prescription
    });
  } catch (err) {
    next(err);
  }
};

// Create prescription
exports.createPrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.createPrescription(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });
  } catch (err) {
    next(err);
  }
};

// Update prescription
exports.updatePrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.updatePrescription(
      req.params.id,
      req.params.prescriptionId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });
  } catch (err) {
    next(err);
  }
};

// Delete prescription
exports.deletePrescription = async (req, res, next) => {
  try {
    const result = await prescriptionService.deletePrescription(
      req.params.id,
      req.params.prescriptionId
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

