const { body, query, param } = require('express-validator');

// Get all footer sections validation
exports.getAllFooterSectionsValidation = [
  query('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be draft or published'),
  query('sortBy')
    .optional()
    .isIn(['order', 'title', 'section', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: order, title, section, createdAt, updatedAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be asc or desc')
];

// Create footer section validation
exports.createFooterSectionValidation = [
  body('section')
    .notEmpty()
    .withMessage('Section is required')
    .isIn([
      'logo',
      'about-us',
      'how-works',
      'leadership',
      'faq',
      'careers',
      'support',
      'blogs',
      'shipping-returns',
      'privacy-policy',
      'terms-conditions',
      'consent-telehealth',
      'contact',
      'address',
      'social-media'
    ])
    .withMessage('Invalid section name'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('logo.url')
    .optional()
    .isString()
    .withMessage('Logo URL must be a string'),
  body('logo.alt')
    .optional()
    .isString()
    .withMessage('Logo alt text must be a string'),
  body('companyDescription')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Company description must not exceed 500 characters'),
  body('content')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10000 characters'),
  body('media')
    .optional()
    .isArray()
    .withMessage('Media must be an array'),
  body('media.*.type')
    .optional()
    .isIn(['image', 'video', 'document'])
    .withMessage('Media type must be image, video, or document'),
  body('media.*.url')
    .optional()
    .isString()
    .withMessage('Media URL must be a string'),
  body('faqs')
    .optional()
    .isArray()
    .withMessage('FAQs must be an array'),
  body('faqs.*.question')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('FAQ question must be between 5 and 500 characters'),
  body('faqs.*.answer')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('FAQ answer must be between 10 and 2000 characters'),
  body('faqs.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('FAQ order must be a non-negative integer'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('contact.primaryMobile')
    .optional()
    .isString()
    .trim()
    .withMessage('Primary mobile must be a string'),
  body('contact.primaryMobileCountryCode')
    .optional()
    .isString()
    .withMessage('Primary mobile country code must be a string'),
  body('contact.secondaryMobile')
    .optional()
    .isString()
    .trim()
    .withMessage('Secondary mobile must be a string'),
  body('contact.secondaryMobileCountryCode')
    .optional()
    .isString()
    .withMessage('Secondary mobile country code must be a string'),
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email'),
  body('contact.supportHours')
    .optional()
    .isString()
    .trim()
    .withMessage('Support hours must be a string'),
  body('address.location')
    .optional()
    .isString()
    .trim()
    .withMessage('Address location must be a string'),
  body('address.street')
    .optional()
    .isString()
    .withMessage('Street address must be a string'),
  body('blogLinks')
    .optional()
    .isArray()
    .withMessage('Blog links must be an array'),
  body('blogLinks.*.title')
    .optional()
    .isString()
    .trim()
    .withMessage('Blog link title must be a string'),
  body('blogLinks.*.url')
    .optional()
    .isURL()
    .withMessage('Blog link URL must be a valid URL'),
  body('socialMedia.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be a valid URL'),
  body('socialMedia.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be a valid URL'),
  body('socialMedia.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be a valid URL'),
  body('socialMedia.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL'),
  body('socialMedia.youtube')
    .optional()
    .isURL()
    .withMessage('YouTube URL must be a valid URL'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be draft or published'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

// Update footer section validation
exports.updateFooterSectionValidation = [
  body('section')
    .optional()
    .isIn([
      'logo',
      'about-us',
      'how-works',
      'leadership',
      'faq',
      'careers',
      'support',
      'blogs',
      'shipping-returns',
      'privacy-policy',
      'terms-conditions',
      'consent-telehealth',
      'contact',
      'address',
      'social-media'
    ])
    .withMessage('Invalid section name'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('logo.url')
    .optional()
    .isString()
    .withMessage('Logo URL must be a string'),
  body('logo.alt')
    .optional()
    .isString()
    .withMessage('Logo alt text must be a string'),
  body('companyDescription')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Company description must not exceed 500 characters'),
  body('content')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Content must not exceed 10000 characters'),
  body('media')
    .optional()
    .isArray()
    .withMessage('Media must be an array'),
  body('faqs')
    .optional()
    .isArray()
    .withMessage('FAQs must be an array'),
  body('faqs.*.question')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('FAQ question must be between 5 and 500 characters'),
  body('faqs.*.answer')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('FAQ answer must be between 10 and 2000 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('contact.primaryMobile')
    .optional()
    .isString()
    .trim()
    .withMessage('Primary mobile must be a string'),
  body('contact.secondaryMobile')
    .optional()
    .isString()
    .trim()
    .withMessage('Secondary mobile must be a string'),
  body('contact.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email'),
  body('contact.supportHours')
    .optional()
    .isString()
    .trim()
    .withMessage('Support hours must be a string'),
  body('address.location')
    .optional()
    .isString()
    .trim()
    .withMessage('Address location must be a string'),
  body('socialMedia.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be a valid URL'),
  body('socialMedia.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be a valid URL'),
  body('socialMedia.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be a valid URL'),
  body('socialMedia.youtube')
    .optional()
    .isURL()
    .withMessage('YouTube URL must be a valid URL'),
  body('blogLinks')
    .optional()
    .isArray()
    .withMessage('Blog links must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be draft or published'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

// Section name validation
exports.sectionNameValidation = [
  param('section')
    .isIn([
      'logo',
      'about-us',
      'how-works',
      'leadership',
      'faq',
      'careers',
      'support',
      'blogs',
      'shipping-returns',
      'privacy-policy',
      'terms-conditions',
      'consent-telehealth',
      'contact',
      'address',
      'social-media'
    ])
    .withMessage('Invalid section name')
];

