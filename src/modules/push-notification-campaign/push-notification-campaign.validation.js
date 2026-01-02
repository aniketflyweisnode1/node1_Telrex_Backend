const { body } = require('express-validator');

// Create Push Notification Campaign Validation
exports.createPushNotificationCampaignValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1 })
    .withMessage('Message cannot be empty'),
  
  body('audience')
    .optional()
    .isIn(['all_mobile_users', 'active_patients', 'inactive_patients', 'custom'])
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

// Update Push Notification Campaign Validation
exports.updatePushNotificationCampaignValidation = [
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('message')
    .optional()
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1 })
    .withMessage('Message cannot be empty'),
  
  body('audience')
    .optional()
    .isIn(['all_mobile_users', 'active_patients', 'inactive_patients', 'custom'])
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

