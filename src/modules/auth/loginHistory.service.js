/**
 * Login History Service - Optimized for non-blocking operations
 */

const LoginHistory = require('../../models/LoginHistory.model');
const AuditLog = require('../../models/AuditLog.model');
const User = require('../../models/User.model');
const { getClientInfo } = require('../../utils/getClientInfo');
const { buildIdentifierOrQuery } = require('../../helpers');

/**
 * Track successful login (NON-BLOCKING)
 */
exports.trackLogin = (req, user, loginMethod = 'password') => {
  setImmediate(async () => {
    try {
      const clientInfo = getClientInfo(req);
      const userId = user._id || user.id;

      // Create both records in parallel
      await Promise.all([
        LoginHistory.create({
          user: userId,
          loginMethod,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          device: clientInfo.device,
          browser: clientInfo.browser,
          os: clientInfo.os,
          status: 'success',
          loginAt: new Date()
        }),
        AuditLog.create({
          user: userId,
          action: `Logged in via ${loginMethod}`,
          resource: 'Authentication System',
          resourceId: userId.toString(),
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          status: 'success',
          metadata: {
            loginMethod,
            device: clientInfo.device,
            browser: clientInfo.browser,
            os: clientInfo.os,
            role: user.role
          },
          timestamp: new Date()
        })
      ]);
    } catch (error) {
      console.error('Failed to track login:', error.message);
    }
  });
};

/**
 * Track failed login attempt (NON-BLOCKING)
 */
exports.trackFailedLogin = (req, identifier, loginMethod = 'password', failureReason = 'Invalid credentials') => {
  setImmediate(async () => {
    try {
      const clientInfo = getClientInfo(req);

      // Create login history immediately (no user lookup needed)
      const loginHistoryPromise = LoginHistory.create({
        user: null,
        loginMethod,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        device: clientInfo.device,
        browser: clientInfo.browser,
        os: clientInfo.os,
        status: 'failed',
        failureReason,
        loginAt: new Date()
      }).catch(err => console.error('LoginHistory create failed:', err.message));

      // Try to find user for audit log (optional)
      const user = await User.findOne(buildIdentifierOrQuery(identifier)).select('_id').lean();

      // Create audit log
      await AuditLog.create({
        user: user?._id || null,
        action: `Failed login attempt via ${loginMethod}`,
        resource: 'Authentication System',
        resourceId: identifier,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        status: 'denied',
        metadata: {
          loginMethod,
          identifier,
          failureReason,
          device: clientInfo.device,
          browser: clientInfo.browser,
          os: clientInfo.os
        },
        timestamp: new Date()
      }).catch(err => console.error('AuditLog create failed:', err.message));

      await loginHistoryPromise;
    } catch (error) {
      console.error('Failed to track failed login:', error.message);
    }
  });
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
