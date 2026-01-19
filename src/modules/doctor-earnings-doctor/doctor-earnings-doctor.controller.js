const doctorEarningsService = require('./doctor-earnings-doctor.service');
const Doctor = require('../../models/Doctor.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

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

// Get earnings summary
exports.getEarningsSummary = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const summary = await doctorEarningsService.getEarningsSummary(userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Earnings summary retrieved successfully',
      data: summary
    });
  } catch (err) {
    next(err);
  }
};

// Get payout requests
exports.getPayoutRequests = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const payouts = await doctorEarningsService.getPayoutRequests(userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Payout requests retrieved successfully',
      data: payouts
    });
  } catch (err) {
    next(err);
  }
};

// Get payout request by ID
exports.getPayoutRequestById = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const payout = await doctorEarningsService.getPayoutRequestById(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Payout request retrieved successfully',
      data: payout
    });
  } catch (err) {
    next(err);
  }
};

// Create payout request
exports.createPayoutRequest = async (req, res, next) => {
  try {
    const payout = await doctorEarningsService.createPayoutRequest(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Payout request created successfully',
      data: payout
    });
  } catch (err) {
    next(err);
  }
};

// Get reports & analytics
exports.getReportsAndAnalytics = async (req, res, next) => {
  try {
    const userId = await getUserId(req);
    const reports = await doctorEarningsService.getReportsAndAnalytics(userId, req.query);
    res.status(200).json({
      success: true,
      message: 'Reports and analytics retrieved successfully',
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

