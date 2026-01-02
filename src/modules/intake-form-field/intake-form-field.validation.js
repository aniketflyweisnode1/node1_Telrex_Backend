const { body } = require('express-validator');

// Add Intake Form Field Validation (fieldType required)
exports.addIntakeFormFieldValidation = [
  body('fieldLabel')
    .notEmpty()
    .withMessage('Field label is required')
    .isString()
    .withMessage('Field label must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Field label must be between 1 and 200 characters'),
  
  body('fieldType')
    .notEmpty()
    .withMessage('Field type is required')
    .isString()
    .withMessage('Field type must be a string')
    .isIn([
      'text',
      'textarea',
      'email',
      'number',
      'tel',
      'date',
      'time',
      'datetime',
      'select',
      'multiselect',
      'radio',
      'checkbox',
      'file',
      'url'
    ])
    .withMessage('Invalid field type. Must be one of: text, textarea, email, number, tel, date, time, datetime, select, multiselect, radio, checkbox, file, url'),
  
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  
  body('placeholder')
    .optional()
    .isString()
    .withMessage('Placeholder must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Placeholder must not exceed 200 characters'),
  
  body('helpText')
    .optional()
    .isString()
    .withMessage('Help text must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Help text must not exceed 500 characters'),
  
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  
  body('options.*.label')
    .optional()
    .notEmpty()
    .withMessage('Option label is required')
    .isString()
    .withMessage('Option label must be a string')
    .trim(),
  
  body('options.*.value')
    .optional()
    .notEmpty()
    .withMessage('Option value is required')
    .isString()
    .withMessage('Option value must be a string')
    .trim(),
  
  body('validation.minLength')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min length must be a non-negative integer'),
  
  body('validation.maxLength')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max length must be a positive integer'),
  
  body('validation.min')
    .optional()
    .isNumeric()
    .withMessage('Min value must be a number'),
  
  body('validation.max')
    .optional()
    .isNumeric()
    .withMessage('Max value must be a number'),
  
  body('validation.pattern')
    .optional()
    .isString()
    .withMessage('Pattern must be a string'),
  
  body('validation.customMessage')
    .optional()
    .isString()
    .withMessage('Custom message must be a string')
    .trim(),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  
  body('section')
    .optional()
    .isIn(['basic_information', 'emergency_contact', 'medical_questions', 'custom'])
    .withMessage('Invalid section')
];

// Update Intake Form Field Validation (all fields optional)
exports.updateIntakeFormFieldValidation = [
  body('fieldLabel')
    .optional()
    .notEmpty()
    .withMessage('Field label cannot be empty')
    .isString()
    .withMessage('Field label must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Field label must be between 1 and 200 characters'),
  
  body('fieldType')
    .optional()
    .notEmpty()
    .withMessage('Field type cannot be empty')
    .isString()
    .withMessage('Field type must be a string')
    .isIn([
      'text',
      'textarea',
      'email',
      'number',
      'tel',
      'date',
      'time',
      'datetime',
      'select',
      'multiselect',
      'radio',
      'checkbox',
      'file',
      'url'
    ])
    .withMessage('Invalid field type. Must be one of: text, textarea, email, number, tel, date, time, datetime, select, multiselect, radio, checkbox, file, url'),
  
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  
  body('placeholder')
    .optional()
    .isString()
    .withMessage('Placeholder must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Placeholder must not exceed 200 characters'),
  
  body('helpText')
    .optional()
    .isString()
    .withMessage('Help text must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Help text must not exceed 500 characters'),
  
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  
  body('options.*.label')
    .optional()
    .notEmpty()
    .withMessage('Option label is required')
    .isString()
    .withMessage('Option label must be a string')
    .trim(),
  
  body('options.*.value')
    .optional()
    .notEmpty()
    .withMessage('Option value is required')
    .isString()
    .withMessage('Option value must be a string')
    .trim(),
  
  body('validation.minLength')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min length must be a non-negative integer'),
  
  body('validation.maxLength')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max length must be a positive integer'),
  
  body('validation.min')
    .optional()
    .isNumeric()
    .withMessage('Min value must be a number'),
  
  body('validation.max')
    .optional()
    .isNumeric()
    .withMessage('Max value must be a number'),
  
  body('validation.pattern')
    .optional()
    .isString()
    .withMessage('Pattern must be a string'),
  
  body('validation.customMessage')
    .optional()
    .isString()
    .withMessage('Custom message must be a string')
    .trim(),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  
  body('section')
    .optional()
    .isIn(['basic_information', 'emergency_contact', 'medical_questions', 'custom'])
    .withMessage('Invalid section')
];

// Validate options are required for select/radio/multiselect
exports.validateFieldTypeOptions = (req, res, next) => {
  const { fieldType, options } = req.body;
  
  // Only validate if fieldType is being set/updated
  if (fieldType) {
    const typesRequiringOptions = ['select', 'multiselect', 'radio'];
    
    if (typesRequiringOptions.includes(fieldType)) {
      if (!options || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Options are required for field type: ${fieldType}`
        });
      }
    }
  }
  
  next();
};
