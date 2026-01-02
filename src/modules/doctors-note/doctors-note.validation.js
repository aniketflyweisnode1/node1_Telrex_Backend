const { body } = require('express-validator');

// Create doctor's note validation
exports.createDoctorsNoteValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['illness', 'injury'])
    .withMessage('Type must be illness or injury'),
  
  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(['work', 'school'])
    .withMessage('Purpose must be work or school'),
  
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('patientName')
    .notEmpty()
    .withMessage('Patient name is required')
    .isString()
    .withMessage('Patient name must be a string'),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0')
];

