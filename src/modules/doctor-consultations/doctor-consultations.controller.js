const doctorConsultationsService = require('./doctor-consultations.service');

// Get all consultations
exports.getConsultations = async (req, res, next) => {
  try {
    const consultations = await doctorConsultationsService.getConsultations(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Consultations retrieved successfully',
      data: consultations
    });
  } catch (err) {
    next(err);
  }
};

// Get consultation by ID
exports.getConsultationById = async (req, res, next) => {
  try {
    const consultation = await doctorConsultationsService.getConsultationById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Consultation retrieved successfully',
      data: consultation
    });
  } catch (err) {
    next(err);
  }
};

// Update consultation status
exports.updateConsultationStatus = async (req, res, next) => {
  try {
    const result = await doctorConsultationsService.updateConsultationStatus(
      req.user.id,
      req.params.id,
      req.body.status
    );
    res.status(200).json({
      success: true,
      message: 'Consultation status updated successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

