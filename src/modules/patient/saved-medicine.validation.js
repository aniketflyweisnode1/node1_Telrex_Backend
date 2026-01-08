const { param, query } = require('express-validator');

// Medicine ID validation
exports.medicineIdValidation = [
  param('medicineId')
    .isMongoId()
    .withMessage('Medicine ID must be a valid MongoDB ID')
];

// Get saved medicines validation
exports.getSavedMedicinesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

