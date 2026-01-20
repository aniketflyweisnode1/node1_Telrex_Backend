const LoginHistory = require('../../models/LoginHistory.model');
const AuditLog = require('../../models/AuditLog.model');
const { getClientInfo } = require('../../utils/getClientInfo');

/**
 * Track successful login
 */
exports.trackLogin = async (req, user, loginMethod = 'password') => {
  try {
    const clientInfo = getClientInfo(req);
    const userId = user._id || user.id;

    // Create login history
    await LoginHistory.create({
      user: userId,
      loginMethod,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      device: clientInfo.device,
      browser: clientInfo.browser,
      os: clientInfo.os,
      status: 'success',
      loginAt: new Date()
    });

    // Create audit log for login
    try {
      await AuditLog.create({
        user: userId,
        action: `Logged in via ${loginMethod}`,
        resource: 'Authentication System',
        resourceId: userId.toString(),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        status: 'success',
        metadata: {
          loginMethod: loginMethod,
          device: clientInfo.device,
          browser: clientInfo.browser,
          os: clientInfo.os,
          role: user.role
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      // Don't break login flow if audit log creation fails
      console.error('Failed to create audit log for login:', auditError.message);
    }
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

    // Create login history
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

    // Create audit log for failed login attempt
    try {
      // Try to find user by identifier for audit log
      const User = require('../../models/User.model');
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phoneNumber: identifier }
        ]
      });

      await AuditLog.create({
        user: user?._id || null,
        action: `Failed login attempt via ${loginMethod}`,
        resource: 'Authentication System',
        resourceId: identifier,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        status: 'denied',
        metadata: {
          loginMethod: loginMethod,
          identifier: identifier,
          failureReason: failureReason,
          device: clientInfo.device,
          browser: clientInfo.browser,
          os: clientInfo.os
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      // Don't break login flow if audit log creation fails
      console.error('Failed to create audit log for failed login:', auditError.message);
    }
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

