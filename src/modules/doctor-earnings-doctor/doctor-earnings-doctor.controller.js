const doctorEarningsService = require('./doctor-earnings-doctor.service');
const logger = require('../../utils/logger');

// Get earnings summary
exports.getEarningsSummary = async (req, res, next) => {
  try {
    const summary = await doctorEarningsService.getEarningsSummary(req.user.id, req.query);
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
    const payouts = await doctorEarningsService.getPayoutRequests(req.user.id, req.query);
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
    const payout = await doctorEarningsService.getPayoutRequestById(req.user.id, req.params.id);
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
    const reports = await doctorEarningsService.getReportsAndAnalytics(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Reports and analytics retrieved successfully',
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

