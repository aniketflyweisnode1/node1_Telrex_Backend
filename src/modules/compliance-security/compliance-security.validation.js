const { body, query, param } = require('express-validator');

// Create Compliance Setting validation
exports.createComplianceSettingValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['hipaa', 'gdpr', 'rbac', 'audit_trail'])
    .withMessage('Type must be hipaa, gdpr, rbac, or audit_trail'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
  
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  
  body('features.*.name')
    .optional()
    .isString()
    .withMessage('Feature name must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Feature name must be between 2 and 200 characters'),
  
  body('features.*.enabled')
    .optional()
    .isBoolean()
    .withMessage('Feature enabled must be a boolean')
];

// Update Compliance Setting validation
exports.updateComplianceSettingValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid compliance setting ID'),
  
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
  
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  
  body('features.*.name')
    .optional()
    .isString()
    .withMessage('Feature name must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Feature name must be between 2 and 200 characters'),
  
  body('features.*.enabled')
    .optional()
    .isBoolean()
    .withMessage('Feature enabled must be a boolean'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Create Security Metric validation
exports.createSecurityMetricValidation = [
  body('metricType')
    .notEmpty()
    .withMessage('Metric type is required')
    .isIn(['failed_login_attempts', 'active_sessions', 'data_export_requests', 'security_alerts'])
    .withMessage('Metric type must be failed_login_attempts, active_sessions, data_export_requests, or security_alerts'),
  
  body('count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Count must be a non-negative integer'),
  
  body('period')
    .optional()
    .isIn(['24h', '7d', '30d', 'all'])
    .withMessage('Period must be 24h, 7d, 30d, or all'),
  
  body('details')
    .optional()
    .isArray()
    .withMessage('Details must be an array')
];

// Update Security Metric validation
exports.updateSecurityMetricValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid security metric ID'),
  
  body('count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Count must be a non-negative integer'),
  
  body('period')
    .optional()
    .isIn(['24h', '7d', '30d', 'all'])
    .withMessage('Period must be 24h, 7d, 30d, or all'),
  
  body('details')
    .optional()
    .isArray()
    .withMessage('Details must be an array')
];

// Get all compliance settings validation
exports.getAllComplianceSettingsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['hipaa', 'gdpr', 'rbac', 'audit_trail'])
    .withMessage('Type must be hipaa, gdpr, rbac, or audit_trail'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'type', 'status'])
    .withMessage('SortBy must be createdAt, updatedAt, type, or status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc')
];

// Get all security metrics validation
exports.getAllSecurityMetricsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('metricType')
    .optional()
    .isIn(['failed_login_attempts', 'active_sessions', 'data_export_requests', 'security_alerts'])
    .withMessage('Metric type must be failed_login_attempts, active_sessions, data_export_requests, or security_alerts'),
  
  query('period')
    .optional()
    .isIn(['24h', '7d', '30d', 'all'])
    .withMessage('Period must be 24h, 7d, 30d, or all'),
  
  query('sortBy')
    .optional()
    .isIn(['date', 'count', 'metricType'])
    .withMessage('SortBy must be date, count, or metricType'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc')
];

// Create Audit Log validation
exports.createAuditLogValidation = [
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isString()
    .withMessage('Action must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Action must be between 2 and 200 characters'),
  
  body('resource')
    .notEmpty()
    .withMessage('Resource is required')
    .isString()
    .withMessage('Resource must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Resource must be between 2 and 200 characters'),
  
  body('resourceId')
    .optional()
    .isString()
    .withMessage('Resource ID must be a string')
    .trim(),
  
  body('status')
    .optional()
    .isIn(['success', 'denied', 'failed'])
    .withMessage('Status must be success, denied, or failed'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Get all audit logs validation
exports.getAllAuditLogsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  query('action')
    .optional()
    .isString()
    .withMessage('Action must be a string')
    .trim(),
  
  query('resource')
    .optional()
    .isString()
    .withMessage('Resource must be a string')
    .trim(),
  
  query('status')
    .optional()
    .isIn(['success', 'denied', 'failed'])
    .withMessage('Status must be success, denied, or failed'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('sortBy')
    .optional()
    .isIn(['timestamp', 'action', 'resource', 'status'])
    .withMessage('SortBy must be timestamp, action, resource, or status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc')
];
