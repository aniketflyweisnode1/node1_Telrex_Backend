const express = require('express');
const router = express.Router();
const doctorEarningsController = require('./doctor-earnings-doctor.controller');
const doctorEarningsValidation = require('./doctor-earnings-doctor.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isDoctor } = require('../../middlewares/doctor.middleware');
const validate = require('../../middlewares/validate.middleware');
const { verifyAccessToken } = require('../../utils/jwt');
const User = require('../../models/User.model');

// Optional auth middleware - sets req.user if token is present, but doesn't fail if missing
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = {
            id: user._id,
            role: user.role,
            email: user.email,
            phoneNumber: user.phoneNumber,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified
          };
        }
      } catch (err) {
        // Token invalid or expired - continue without setting req.user
        // This allows public access with doctorId
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

// GET routes support both authenticated (with token) and public (with doctorId) access
// Get earnings summary
router.get(
  '/summary',
  optionalAuth,
  doctorEarningsValidation.getEarningsSummaryValidation,
  validate,
  doctorEarningsController.getEarningsSummary
);

// Get payout requests
router.get(
  '/payouts',
  optionalAuth,
  doctorEarningsValidation.getPayoutRequestsValidation,
  validate,
  doctorEarningsController.getPayoutRequests
);

// Get payout request by ID
router.get(
  '/payouts/:id',
  optionalAuth,
  doctorEarningsController.getPayoutRequestById
);

// Get reports & analytics
router.get(
  '/reports',
  optionalAuth,
  doctorEarningsValidation.getReportsAndAnalyticsValidation,
  validate,
  doctorEarningsController.getReportsAndAnalytics
);

// All other routes require authentication and doctor role
router.use(authMiddleware);
router.use(isDoctor);

// Create payout request
router.post(
  '/payouts',
  doctorEarningsValidation.createPayoutRequestValidation,
  validate,
  doctorEarningsController.createPayoutRequest
);

module.exports = router;

