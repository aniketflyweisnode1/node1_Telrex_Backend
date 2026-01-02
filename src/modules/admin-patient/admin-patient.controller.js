const adminPatientService = require('./admin-patient.service');

// Get all patients
exports.getAllPatients = async (req, res, next) => {
  try {
    const result = await adminPatientService.getAllPatients(req.query);
    res.status(200).json({
      success: true,
      data: result.patients,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get patient by ID with all relations
exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await adminPatientService.getPatientById(req.params.id);
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// Update patient status (activate/deactivate)
exports.updatePatientStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const patient = await adminPatientService.updatePatientStatus(req.params.id, isActive);
    res.status(200).json({
      success: true,
      message: `Patient ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: patient
    });
  } catch (err) {
    next(err);
  }
};

// Get patient statistics
exports.getPatientStatistics = async (req, res, next) => {
  try {
    const statistics = await adminPatientService.getPatientStatistics();
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

