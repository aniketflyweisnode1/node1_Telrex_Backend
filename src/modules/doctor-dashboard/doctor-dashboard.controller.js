const doctorDashboardService = require('./doctor-dashboard.service');
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
  
  throw new AppError('User ID or Doctor ID is required', 400);
};

// Get Dashboard Overview
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const dashboardData = await doctorDashboardService.getDashboardOverview(userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
};

// Get Recent Consultations
exports.getRecentConsultations = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const consultations = await doctorDashboardService.getRecentConsultations(userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Recent consultations retrieved successfully',
      data: consultations
    });
  } catch (err) {
    next(err);
  }
};

// Get Today's Schedule
exports.getTodaysSchedule = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const schedule = await doctorDashboardService.getTodaysSchedule(userId, req.query);
    res.status(200).json({
      success: true,
      message: "Today's schedule retrieved successfully",
      data: schedule
    });
  } catch (err) {
    next(err);
  }
};

