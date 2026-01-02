const LoginHistory = require('../../models/LoginHistory.model');
const { getClientInfo } = require('../../utils/getClientInfo');

/**
 * Track successful login
 */
exports.trackLogin = async (req, user, loginMethod = 'password') => {
  try {
    const clientInfo = getClientInfo(req);

    await LoginHistory.create({
      user: user._id || user.id,
      loginMethod,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      device: clientInfo.device,
      browser: clientInfo.browser,
      os: clientInfo.os,
      status: 'success',
      loginAt: new Date()
    });
  } catch (error) {
    // Don't throw error - login tracking should not break login flow
    console.error('Failed to track login:', error.message);
  }
};

/**
 * Track failed login attempt
 */
exports.trackFailedLogin = async (req, identifier, loginMethod = 'password', failureReason = 'Invalid credentials') => {
  try {
    const clientInfo = getClientInfo(req);

    await LoginHistory.create({
      user: null, // No user for failed logins
      loginMethod,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      device: clientInfo.device,
      browser: clientInfo.browser,
      os: clientInfo.os,
      status: 'failed',
      failureReason,
      loginAt: new Date()
    });
  } catch (error) {
    console.error('Failed to track failed login:', error.message);
  }
};

/**
 * Get user's login history
 */
exports.getUserLoginHistory = async (userId, limit = 50) => {
  return await LoginHistory.find({ user: userId })
    .sort({ loginAt: -1 })
    .limit(limit)
    .select('-userAgent')
    .lean();
};

/**
 * Get recent logins by IP address
 */
exports.getLoginsByIp = async (ipAddress, limit = 20) => {
  return await LoginHistory.find({ ipAddress })
    .populate('user', 'firstName lastName email phoneNumber role')
    .sort({ loginAt: -1 })
    .limit(limit)
    .lean();
};

