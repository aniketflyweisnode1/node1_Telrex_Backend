const { body } = require('express-validator');

// Create SMS Campaign Validation
exports.createSMSCampaignValidation = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1, max: 160 })
    .withMessage('Message must be between 1 and 160 characters'),
  
  body('audience')
    .optional()
    .isIn(['all_patients', 'active_patients', 'inactive_patients', 'custom'])
    .withMessage('Invalid audience type'),
  
  body('customRecipients')
    .optional()
    .isArray()
    .withMessage('Custom recipients must be an array'),
  
  body('customRecipients.*')
    .optional()
    .isMongoId()
    .withMessage('Each recipient must be a valid patient ID'),
  
  body('scheduleType')
    .optional()
    .isIn(['send_now', 'scheduled'])
    .withMessage('Schedule type must be either send_now or scheduled'),
  
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.scheduleType === 'scheduled' && !value) {
        throw new Error('Scheduled date is required when schedule type is scheduled');
      }
      if (value) {
        const scheduledDate = new Date(value);
        const now = new Date();
        if (scheduledDate <= now) {
          throw new Error('Scheduled date must be in the future');
        }
      }
      return true;
    })
];

// Update SMS Campaign Validation
exports.updateSMSCampaignValidation = [
  body('message')
    .optional()
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1, max: 160 })
    .withMessage('Message must be between 1 and 160 characters'),
  
  body('audience')
    .optional()
    .isIn(['all_patients', 'active_patients', 'inactive_patients', 'custom'])
    .withMessage('Invalid audience type'),
  
  body('customRecipients')
    .optional()
    .isArray()
    .withMessage('Custom recipients must be an array'),
  
  body('customRecipients.*')
    .optional()
    .isMongoId()
    .withMessage('Each recipient must be a valid patient ID'),
  
  body('scheduleType')
    .optional()
    .isIn(['send_now', 'scheduled'])
    .withMessage('Schedule type must be either send_now or scheduled'),
  
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date')
    .custom((value) => {
      if (value) {
        const scheduledDate = new Date(value);
        const now = new Date();
        if (scheduledDate <= now) {
          throw new Error('Scheduled date must be in the future');
        }
      }
      return true;
    })
];

