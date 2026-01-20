const complianceSecurityService = require('./compliance-security.service');

// ==================== COMPLIANCE SETTINGS ====================

// Create compliance setting
exports.createComplianceSetting = async (req, res, next) => {
  try {
    const complianceSetting = await complianceSecurityService.createComplianceSetting(
      req.body,
      req.user?.id
    );
    
    res.status(201).json({
      success: true,
      message: 'Compliance setting created successfully',
      data: complianceSetting
    });
  } catch (err) {
    next(err);
  }
};

// Get all compliance settings
exports.getAllComplianceSettings = async (req, res, next) => {
  try {
    const result = await complianceSecurityService.getAllComplianceSettings(req.query);
    
    res.status(200).json({
      success: true,
      message: 'Compliance settings retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get compliance setting by ID
exports.getComplianceSettingById = async (req, res, next) => {
  try {
    const complianceSetting = await complianceSecurityService.getComplianceSettingById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Compliance setting retrieved successfully',
      data: complianceSetting
    });
  } catch (err) {
    next(err);
  }
};

// Get compliance setting by type
exports.getComplianceSettingByType = async (req, res, next) => {
  try {
    const complianceSetting = await complianceSecurityService.getComplianceSettingByType(req.params.type);
    
    res.status(200).json({
      success: true,
      message: 'Compliance setting retrieved successfully',
      data: complianceSetting
    });
  } catch (err) {
    next(err);
  }
};

// Update compliance setting
exports.updateComplianceSetting = async (req, res, next) => {
  try {
    const complianceSetting = await complianceSecurityService.updateComplianceSetting(
      req.params.id,
      req.body,
      req.user?.id
    );
    
    res.status(200).json({
      success: true,
      message: 'Compliance setting updated successfully',
      data: complianceSetting
    });
  } catch (err) {
    next(err);
  }
};

// Delete compliance setting (soft delete)
exports.deleteComplianceSetting = async (req, res, next) => {
  try {
    await complianceSecurityService.deleteComplianceSetting(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Compliance setting deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Hard delete compliance setting (permanent delete)
exports.hardDeleteComplianceSetting = async (req, res, next) => {
  try {
    await complianceSecurityService.hardDeleteComplianceSetting(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Compliance setting permanently deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// ==================== SECURITY METRICS ====================

// Create security metric
exports.createSecurityMetric = async (req, res, next) => {
  try {
    const securityMetric = await complianceSecurityService.createSecurityMetric(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Security metric created successfully',
      data: securityMetric
    });
  } catch (err) {
    next(err);
  }
};

// Get all security metrics
exports.getAllSecurityMetrics = async (req, res, next) => {
  try {
    const result = await complianceSecurityService.getAllSecurityMetrics(req.query);
    
    res.status(200).json({
      success: true,
      message: 'Security metrics retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get security metric by ID
exports.getSecurityMetricById = async (req, res, next) => {
  try {
    const securityMetric = await complianceSecurityService.getSecurityMetricById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Security metric retrieved successfully',
      data: securityMetric
    });
  } catch (err) {
    next(err);
  }
};

// Update security metric
exports.updateSecurityMetric = async (req, res, next) => {
  try {
    const securityMetric = await complianceSecurityService.updateSecurityMetric(
      req.params.id,
      req.body
    );
    
    res.status(200).json({
      success: true,
      message: 'Security metric updated successfully',
      data: securityMetric
    });
  } catch (err) {
    next(err);
  }
};

// Delete security metric (soft delete)
exports.deleteSecurityMetric = async (req, res, next) => {
  try {
    await complianceSecurityService.deleteSecurityMetric(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Security metric deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Hard delete security metric (permanent delete)
exports.hardDeleteSecurityMetric = async (req, res, next) => {
  try {
    await complianceSecurityService.hardDeleteSecurityMetric(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Security metric permanently deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// ==================== DASHBOARD ====================

// Get dashboard statistics
exports.getDashboardStatistics = async (req, res, next) => {
  try {
    const statistics = await complianceSecurityService.getDashboardStatistics();
    
    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

// ==================== TWO-FACTOR AUTHENTICATION ====================

// Get 2FA statistics
exports.get2FAStatistics = async (req, res, next) => {
  try {
    const statistics = await complianceSecurityService.get2FAStatistics();
    
    res.status(200).json({
      success: true,
      message: '2FA statistics retrieved successfully',
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

// ==================== AUDIT LOGS ====================

// Create audit log
exports.createAuditLog = async (req, res, next) => {
  try {
    const auditLog = await complianceSecurityService.createAuditLog({
      userId: req.user?.id || req.body.userId,
      action: req.body.action,
      resource: req.body.resource,
      resourceId: req.body.resourceId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      status: req.body.status,
      metadata: req.body.metadata
    });
    
    res.status(201).json({
      success: true,
      message: 'Audit log created successfully',
      data: auditLog
    });
  } catch (err) {
    next(err);
  }
};

// Get all audit logs
exports.getAllAuditLogs = async (req, res, next) => {
  try {
    const result = await complianceSecurityService.getAllAuditLogs(req.query);
    
    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get recent audit logs
exports.getRecentAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const auditLogs = await complianceSecurityService.getRecentAuditLogs(limit);
    
    res.status(200).json({
      success: true,
      message: 'Recent audit logs retrieved successfully',
      data: auditLogs
    });
  } catch (err) {
    next(err);
  }
};

// Get audit log by ID
exports.getAuditLogById = async (req, res, next) => {
  try {
    const auditLog = await complianceSecurityService.getAuditLogById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: auditLog
    });
  } catch (err) {
    next(err);
  }
};

// Delete audit log
exports.deleteAuditLog = async (req, res, next) => {
  try {
    await complianceSecurityService.deleteAuditLog(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Audit log deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

