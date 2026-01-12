const doctorConsultationsService = require('./doctor-consultations.service');
const Doctor = require('../../models/Doctor.model');
const AppError = require('../../utils/AppError');

// Helper function to get userId from req (authenticated) or query params (public)
const getUserId = async (req) => {
  // If user is authenticated, use req.user.id
  if (req.user && req.user.id) {
    return req.user.id;
  }
  
  // If public route, get userId from query parameters
  const { userId, doctorId } = req.query;
  
  if (userId) {
    return userId;
  }
  
  if (doctorId) {
    // Find doctor and get the associated user ID
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }
    return doctor.user.toString();
  }
  
  throw new AppError('User ID or Doctor ID is required. For public access, provide userId or doctorId as query parameter. Example: ?userId=... or ?doctorId=...', 400);
};

// Get all consultations (no doctor filter - for admin)
exports.getAllConsultations = async (req, res, next) => {
  try {
    const consultations = await doctorConsultationsService.getAllConsultations(req.query);
    res.status(200).json({
      success: true,
      message: 'All consultations retrieved successfully',
      data: consultations
    });
  } catch (err) {
    next(err);
  }
};

// Get consultations by doctor (filters by specific doctor)
exports.getConsultationsByDoctor = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const consultations = await doctorConsultationsService.getConsultationsByDoctor(userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Consultations retrieved successfully',
      data: consultations
    });
  } catch (err) {
    next(err);
  }
};

// Get consultations by doctor ID (path parameter)
exports.getConsultationsByDoctorId = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const consultations = await doctorConsultationsService.getConsultationsByDoctorId(doctorId, req.query);
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
    // userId is optional - if provided, verify doctor access; if not, return consultation directly
    let userId = null;
    let doctorId = req.query.doctorId || null;
    
    // Try to get userId from auth or query params
    try {
      userId = await getUserId(req);
    } catch (err) {
      // If getUserId fails (no auth, no query params), userId remains null for public access
      userId = null;
    }
    
    // If doctorId is provided in query params, use it (even if userId exists, doctorId takes precedence for filtering)
    if (req.query.doctorId) {
      doctorId = req.query.doctorId;
      // If doctorId is provided, don't use userId (use doctorId directly)
      userId = null;
    }
    
    const consultation = await doctorConsultationsService.getConsultationById(userId, req.params.id, doctorId);
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

