const { body } = require('express-validator');

// Create Notification Campaign Validation
exports.createNotificationCampaignValidation = [
  body('campaignName')
    .notEmpty()
    .withMessage('Campaign name is required')
    .isString()
    .withMessage('Campaign name must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Campaign name must be between 1 and 200 characters'),
  
  body('campaignType')
    .notEmpty()
    .withMessage('Campaign type is required')
    .isIn(['email', 'sms', 'push_notification'])
    .withMessage('Campaign type must be email, sms, or push_notification'),
  
  // Email-specific validation
  body('subject')
    .if(body('campaignType').equals('email'))
    .notEmpty()
    .withMessage('Subject is required for email campaigns')
    .isString()
    .withMessage('Subject must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  
  // Push notification-specific validation
  body('title')
    .if(body('campaignType').equals('push_notification'))
    .notEmpty()
    .withMessage('Title is required for push notification campaigns')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  // Common message validation
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1 })
    .withMessage('Message cannot be empty')
    .custom((value, { req }) => {
      // SMS has 160 character limit
      if (req.body.campaignType === 'sms' && value.length > 160) {
        throw new Error('SMS message must be 160 characters or less');
      }
      return true;
    }),
  
  body('audience')
    .optional()
    .isIn(['all_patients', 'active_patients', 'inactive_patients', 'all_mobile_users', 'custom'])
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

// Update Notification Campaign Validation
exports.updateNotificationCampaignValidation = [
  body('campaignName')
    .optional()
    .notEmpty()
    .withMessage('Campaign name cannot be empty')
    .isString()
    .withMessage('Campaign name must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Campaign name must be between 1 and 200 characters'),
  
  body('campaignType')
    .optional()
    .isIn(['email', 'sms', 'push_notification'])
    .withMessage('Campaign type must be email, sms, or push_notification'),
  
  body('subject')
    .optional()
    .notEmpty()
    .withMessage('Subject cannot be empty')
    .isString()
    .withMessage('Subject must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  
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
    .withMessage('Message cannot be empty')
    .custom((value, { req }) => {
      // Check if updating to SMS type
      const campaignType = req.body.campaignType;
      if ((campaignType === 'sms' || !campaignType) && value && value.length > 160) {
        throw new Error('SMS message must be 160 characters or less');
      }
      return true;
    }),
  
  body('audience')
    .optional()
    .isIn(['all_patients', 'active_patients', 'inactive_patients', 'all_mobile_users', 'custom'])
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

