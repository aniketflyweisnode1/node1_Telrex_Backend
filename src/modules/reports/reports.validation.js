const { query } = require('express-validator');

// Common validation for date range
const commonDateValidation = [
  query('period')
    .optional()
    .isIn(['last_7_days', 'last_30_days', 'last_90_days', 'last_365_days', 'this_month', 'last_month', 'this_year'])
    .withMessage('Invalid period'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for Consultation Activity
exports.getConsultationActivityValidation = [
  ...commonDateValidation,
  query('doctorId')
    .optional()
    .isMongoId()
    .withMessage('Doctor ID must be a valid MongoDB ID'),
  query('patientId')
    .optional()
    .isMongoId()
    .withMessage('Patient ID must be a valid MongoDB ID'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
];

// Validation for Prescriptions & Orders
exports.getPrescriptionsAndOrdersValidation = [
  ...commonDateValidation,
  query('type')
    .optional()
    .isIn(['prescriptions', 'orders', 'all'])
    .withMessage('Type must be prescriptions, orders, or all'),
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
];

// Validation for Financial Settlement
exports.getFinancialSettlementValidation = [
  ...commonDateValidation,
  query('type')
    .optional()
    .isIn(['payments', 'payouts', 'all'])
    .withMessage('Type must be payments, payouts, or all'),
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
];

// Validation for Pharmacy Inventory
exports.getPharmacyInventoryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string'),
  query('brand')
    .optional()
    .isString()
    .withMessage('Brand must be a string'),
  query('sortBy')
    .optional()
    .isIn(['productName', 'brand', 'salePrice', 'originalPrice', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('lowStock')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Low stock must be true or false')
];

// Validation for exports
exports.exportValidation = [
  query('format')
    .optional()
    .isIn(['excel', 'csv', 'pdf'])
    .withMessage('Format must be excel, csv, or pdf')
];

