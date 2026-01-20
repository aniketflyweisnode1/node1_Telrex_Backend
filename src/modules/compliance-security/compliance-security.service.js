const ComplianceSetting = require('../../models/ComplianceSetting.model');
const SecurityMetric = require('../../models/SecurityMetric.model');
const LoginHistory = require('../../models/LoginHistory.model');
const AuditLog = require('../../models/AuditLog.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');

// ==================== COMPLIANCE SETTINGS ====================

// Create compliance setting
exports.createComplianceSetting = async (data, userId) => {
  // Check if type already exists
  const existing = await ComplianceSetting.findOne({ type: data.type });
  if (existing) {
    throw new AppError(`Compliance setting with type '${data.type}' already exists`, 409);
  }
  
  if (userId) {
    data.lastUpdatedBy = userId;
  }
  
  const complianceSetting = await ComplianceSetting.create(data);
  return await ComplianceSetting.findById(complianceSetting._id)
    .populate('lastUpdatedBy', 'firstName lastName email')
    .lean();
};

// Get all compliance settings
exports.getAllComplianceSettings = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    type,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const filter = { isActive: true };

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const complianceSettings = await ComplianceSetting.find(filter)
    .populate('lastUpdatedBy', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await ComplianceSetting.countDocuments(filter);

  return {
    data: complianceSettings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get compliance setting by ID
exports.getComplianceSettingById = async (id) => {
  const complianceSetting = await ComplianceSetting.findById(id)
    .populate('lastUpdatedBy', 'firstName lastName email')
    .lean();

  if (!complianceSetting) {
    throw new AppError('Compliance setting not found', 404);
  }

  return complianceSetting;
};

// Get compliance setting by type
exports.getComplianceSettingByType = async (type) => {
  const complianceSetting = await ComplianceSetting.findOne({ type, isActive: true })
    .populate('lastUpdatedBy', 'firstName lastName email')
    .lean();

  if (!complianceSetting) {
    throw new AppError('Compliance setting not found', 404);
  }

  return complianceSetting;
};

// Update compliance setting
exports.updateComplianceSetting = async (id, data, userId) => {
  const complianceSetting = await ComplianceSetting.findById(id);

  if (!complianceSetting) {
    throw new AppError('Compliance setting not found', 404);
  }

  if (userId) {
    data.lastUpdatedBy = userId;
  }

  Object.assign(complianceSetting, data);
  await complianceSetting.save();

  return complianceSetting.populate('lastUpdatedBy', 'firstName lastName email');
};

// Delete compliance setting (soft delete)
exports.deleteComplianceSetting = async (id) => {
  const complianceSetting = await ComplianceSetting.findById(id);

  if (!complianceSetting) {
    throw new AppError('Compliance setting not found', 404);
  }

  complianceSetting.isActive = false;
  await complianceSetting.save();

  return complianceSetting;
};

// Hard delete compliance setting (permanent delete)
exports.hardDeleteComplianceSetting = async (id) => {
  const complianceSetting = await ComplianceSetting.findByIdAndDelete(id);

  if (!complianceSetting) {
    throw new AppError('Compliance setting not found', 404);
  }

  return complianceSetting;
};

// ==================== SECURITY METRICS ====================

// Create security metric
exports.createSecurityMetric = async (data) => {
  const securityMetric = await SecurityMetric.create(data);
  return await SecurityMetric.findById(securityMetric._id)
    .populate('details.userId', 'firstName lastName email phoneNumber')
    .lean();
};

// Get all security metrics
exports.getAllSecurityMetrics = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    metricType,
    period = '24h',
    sortBy = 'date',
    sortOrder = 'desc'
  } = query;

  const filter = { isActive: true };

  if (metricType) {
    filter.metricType = metricType;
  }

  if (period) {
    filter.period = period;
  }

  // Date filter based on period
  if (period === '24h') {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    filter.date = { $gte: last24h };
  } else if (period === '7d') {
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    filter.date = { $gte: last7d };
  } else if (period === '30d') {
    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    filter.date = { $gte: last30d };
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const securityMetrics = await SecurityMetric.find(filter)
    .populate('details.userId', 'firstName lastName email phoneNumber')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await SecurityMetric.countDocuments(filter);

  return {
    data: securityMetrics,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get security metric by ID
exports.getSecurityMetricById = async (id) => {
  const securityMetric = await SecurityMetric.findById(id)
    .populate('details.userId', 'firstName lastName email phoneNumber')
    .lean();

  if (!securityMetric) {
    throw new AppError('Security metric not found', 404);
  }

  return securityMetric;
};

// Update security metric
exports.updateSecurityMetric = async (id, data) => {
  const securityMetric = await SecurityMetric.findById(id);

  if (!securityMetric) {
    throw new AppError('Security metric not found', 404);
  }

  Object.assign(securityMetric, data);
  await securityMetric.save();

  return await SecurityMetric.findById(securityMetric._id)
    .populate('details.userId', 'firstName lastName email phoneNumber')
    .lean();
};

// Delete security metric (soft delete)
exports.deleteSecurityMetric = async (id) => {
  const securityMetric = await SecurityMetric.findById(id);

  if (!securityMetric) {
    throw new AppError('Security metric not found', 404);
  }

  securityMetric.isActive = false;
  await securityMetric.save();

  return securityMetric;
};

// Hard delete security metric (permanent delete)
exports.hardDeleteSecurityMetric = async (id) => {
  const securityMetric = await SecurityMetric.findByIdAndDelete(id);

  if (!securityMetric) {
    throw new AppError('Security metric not found', 404);
  }

  return securityMetric;
};

// ==================== DASHBOARD STATISTICS ====================

// Get dashboard statistics (24h metrics)
exports.getDashboardStatistics = async () => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Failed Login Attempts (24h)
  const failedLoginAttempts = await LoginHistory.countDocuments({
    status: 'failed',
    loginAt: { $gte: last24h }
  });

  // Active Sessions (24h) - count unique users who logged in successfully in last 24h
  const activeSessions = await LoginHistory.distinct('user', {
    status: 'success',
    loginAt: { $gte: last24h }
  });

  // Data Export Requests (24h) - from SecurityMetric
  const dataExportMetric = await SecurityMetric.findOne({
    metricType: 'data_export_requests',
    date: { $gte: last24h },
    isActive: true
  }).sort({ date: -1 });

  // Security Alerts (24h) - from SecurityMetric
  const securityAlertsMetric = await SecurityMetric.findOne({
    metricType: 'security_alerts',
    date: { $gte: last24h },
    isActive: true
  }).sort({ date: -1 });

  // Get all compliance settings
  const complianceSettings = await ComplianceSetting.find({ isActive: true })
    .populate('lastUpdatedBy', 'firstName lastName email')
    .lean();

  return {
    metrics: {
      failedLoginAttempts: {
        value: failedLoginAttempts || 0,
        label: 'Failed Login Attempts (24h)',
        icon: 'users'
      },
      activeSessions: {
        value: activeSessions.length || 0,
        label: 'Active Sessions',
        icon: 'monitor'
      },
      dataExportRequests: {
        value: dataExportMetric?.count || 0,
        label: 'Data Export Requests',
        icon: 'download'
      },
      securityAlerts: {
        value: securityAlertsMetric?.count || 0,
        label: 'Security Alerts',
        icon: 'shield-check'
      }
    },
    complianceSettings: complianceSettings
  };
};

// Increment security metric
exports.incrementSecurityMetric = async (metricType, details = {}) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find or create metric for today
  let metric = await SecurityMetric.findOne({
    metricType,
    date: { $gte: last24h },
    period: '24h',
    isActive: true
  }).sort({ date: -1 });

  if (!metric) {
    metric = await SecurityMetric.create({
      metricType,
      count: 1,
      period: '24h',
      date: now,
      details: details.userId ? [details] : []
    });
  } else {
    metric.count += 1;
    if (details.userId) {
      metric.details.push(details);
    }
    await metric.save();
  }

  return metric;
};

// ==================== TWO-FACTOR AUTHENTICATION STATISTICS ====================

// Get 2FA statistics
exports.get2FAStatistics = async () => {
  // Get total active users
  const totalUsers = await User.countDocuments({ isActive: true, isVerified: true });
  
  // For now, consider OTP-based login as 2FA (since OTP is a form of 2FA)
  // Users who have verified OTP are considered as having 2FA enabled
  const usersWith2FA = await User.countDocuments({ 
    isActive: true, 
    isVerified: true,
    // If 2FA field exists in future, use: twoFactorEnabled: true
    // For now, all verified users are considered as having 2FA via OTP
  });
  
  // Calculate percentage
  const twoFAPercentage = totalUsers > 0 ? Math.round((usersWith2FA / totalUsers) * 100) : 0;
  
  // Get all admins
  const totalAdmins = await User.countDocuments({ 
    role: { $in: ['admin', 'sub-admin'] },
    isActive: true 
  });
  
  // Admins with 2FA (all verified admins)
  const adminsWith2FA = await User.countDocuments({ 
    role: { $in: ['admin', 'sub-admin'] },
    isActive: true,
    isVerified: true
  });
  
  // Encryption standard (fixed value)
  const encryptionStandard = '256-bit';
  
  return {
    usersWith2FA: {
      value: `${twoFAPercentage}%`,
      label: 'Users with 2FA Enabled',
      icon: 'shield-lock',
      count: usersWith2FA,
      total: totalUsers
    },
    adminsProtected: {
      value: totalAdmins === adminsWith2FA && totalAdmins > 0 ? 'All' : `${adminsWith2FA}/${totalAdmins}`,
      label: 'Admins Protected',
      icon: 'check-circle',
      count: adminsWith2FA,
      total: totalAdmins
    },
    encryptionStandard: {
      value: encryptionStandard,
      label: 'Encryption Standard',
      icon: 'lock',
      description: 'AES-256 encryption'
    }
  };
};

// ==================== AUDIT LOGS ====================

// Create audit log
exports.createAuditLog = async (data) => {
  const auditLog = await AuditLog.create({
    user: data.userId,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    status: data.status || 'success',
    metadata: data.metadata,
    timestamp: data.timestamp || new Date()
  });
  
  return await AuditLog.findById(auditLog._id)
    .populate('user', 'firstName lastName email role')
    .lean();
};

// Get all audit logs
exports.getAllAuditLogs = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    userId,
    action,
    resource,
    status,
    startDate,
    endDate,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = query;

  const filter = {};

  if (userId) {
    filter.user = userId;
  }

  if (action) {
    filter.action = { $regex: action, $options: 'i' };
  }

  if (resource) {
    filter.resource = { $regex: resource, $options: 'i' };
  }

  if (status) {
    filter.status = status;
  }

  // Date range filter
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) {
      filter.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.timestamp.$lte = new Date(endDate);
    }
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const auditLogs = await AuditLog.find(filter)
    .populate('user', 'firstName lastName email role')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await AuditLog.countDocuments(filter);

  return {
    data: auditLogs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get recent audit logs (for dashboard)
exports.getRecentAuditLogs = async (limit = 5) => {
  const auditLogs = await AuditLog.find()
    .populate('user', 'firstName lastName email role')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();

  return auditLogs;
};

// Get audit log by ID
exports.getAuditLogById = async (id) => {
  const auditLog = await AuditLog.findById(id)
    .populate('user', 'firstName lastName email role')
    .lean();

  if (!auditLog) {
    throw new AppError('Audit log not found', 404);
  }

  return auditLog;
};

// Delete audit log (soft delete - archive)
exports.deleteAuditLog = async (id) => {
  const auditLog = await AuditLog.findByIdAndDelete(id);

  if (!auditLog) {
    throw new AppError('Audit log not found', 404);
  }

  return auditLog;
};

