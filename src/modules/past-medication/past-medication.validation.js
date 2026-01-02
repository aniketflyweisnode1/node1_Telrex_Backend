const { body } = require('express-validator');

// Add/Update Past Medication Validation
exports.pastMedicationValidation = [
  body('doctor')
    .notEmpty()
    .withMessage('Doctor name is required')
    .isString()
    .withMessage('Doctor name must be a string'),
  
  body('issueDate')
    .notEmpty()
    .withMessage('Issue date is required')
    .isISO8601()
    .withMessage('Issue date must be a valid date (YYYY-MM-DD)'),
  
  body('prescribedMedications')
    .notEmpty()
    .withMessage('Prescribed medications are required')
    .isArray({ min: 1 })
    .withMessage('At least one prescribed medication is required'),
  
  body('prescribedMedications.*')
    .notEmpty()
    .withMessage('Each medication name cannot be empty')
    .isString()
    .withMessage('Each medication must be a string'),
  
  body('clinic')
    .notEmpty()
    .withMessage('Clinic name is required')
    .isString()
    .withMessage('Clinic name must be a string'),
  
  body('diagnosedCondition')
    .notEmpty()
    .withMessage('Diagnosed condition is required')
    .isString()
    .withMessage('Diagnosed condition must be a string'),
  
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string')
];

