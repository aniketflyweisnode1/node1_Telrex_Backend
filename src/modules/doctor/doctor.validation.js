const { body } = require('express-validator');

// Create doctor validation
exports.createDoctorValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Country code must be a string')
    .default('+91'),
  body('specialty')
    .notEmpty()
    .withMessage('Specialty is required')
    .isIn([
      'General Practice',
      'Cardiology',
      'Pediatrics',
      'Dermatology',
      'Orthopedics',
      'Neurology',
      'Psychiatry',
      'Oncology',
      'Gynecology',
      'Urology',
      'Ophthalmology',
      'ENT',
      'Pulmonology',
      'Gastroenterology',
      'Endocrinology',
      'Rheumatology',
      'Other'
    ])
    .withMessage('Invalid specialty'),
  body('licenseNumber')
    .notEmpty()
    .withMessage('License number is required')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('License number must be between 3 and 50 characters'),
  body('licenseVerified')
    .optional()
    .isBoolean()
    .withMessage('licenseVerified must be a boolean'),
  body('consultationFee')
    .notEmpty()
    .withMessage('Consultation fee is required')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  body('status')
    .optional()
    .isIn(['active', 'pending', 'suspended'])
    .withMessage('Status must be active, pending, or suspended')
    .default('pending'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),
  body('education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),
  body('education.*.degree')
    .optional()
    .isString()
    .withMessage('Degree must be a string'),
  body('education.*.institution')
    .optional()
    .isString()
    .withMessage('Institution must be a string'),
  body('education.*.year')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be a valid year'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  body('certifications.*.name')
    .optional()
    .isString()
    .withMessage('Certification name must be a string'),
  body('certifications.*.issuingOrganization')
    .optional()
    .isString()
    .withMessage('Issuing organization must be a string'),
  body('certifications.*.issuedBy')
    .optional()
    .isString()
    .withMessage('Issued by must be a string'),
  body('certifications.*.year')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be a valid year'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  body('languages.*')
    .optional()
    .isString()
    .withMessage('Each language must be a string'),
  body('availability')
    .optional()
    .isObject()
    .withMessage('Availability must be an object'),
  body('availability.days')
    .optional()
    .isArray()
    .withMessage('Availability days must be an array'),
  body('availability.days.*')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day'),
  body('availability.timeSlots')
    .optional()
    .isArray()
    .withMessage('Time slots must be an array'),
  body('availability.timeSlots.*.from')
    .optional()
    .isString()
    .withMessage('Time slot from must be a string'),
  body('availability.timeSlots.*.to')
    .optional()
    .isString()
    .withMessage('Time slot to must be a string'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  body('address.clinicName')
    .optional()
    .isString()
    .withMessage('Clinic name must be a string'),
  body('address.city')
    .optional()
    .isString()
    .withMessage('City must be a string'),
  body('address.state')
    .optional()
    .isString()
    .withMessage('State must be a string'),
  body('address.country')
    .optional()
    .isString()
    .withMessage('Country must be a string'),
  body('address.pincode')
    .optional()
    .isString()
    .withMessage('Pincode must be a string'),
  body('profilePicture')
    .optional()
    .isString()
    .withMessage('Profile picture must be a string'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters')
];

// Update doctor validation
exports.updateDoctorValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Country code must be a string'),
  body('specialty')
    .optional()
    .isIn([
      'General Practice',
      'Cardiology',
      'Pediatrics',
      'Dermatology',
      'Orthopedics',
      'Neurology',
      'Psychiatry',
      'Oncology',
      'Gynecology',
      'Urology',
      'Ophthalmology',
      'ENT',
      'Pulmonology',
      'Gastroenterology',
      'Endocrinology',
      'Rheumatology',
      'Other'
    ])
    .withMessage('Invalid specialty'),
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('License number must be between 3 and 50 characters'),
  body('licenseVerified')
    .optional()
    .isBoolean()
    .withMessage('licenseVerified must be a boolean'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  body('status')
    .optional()
    .isIn(['active', 'pending', 'suspended'])
    .withMessage('Status must be active, pending, or suspended'),
  body('profilePicture')
    .optional()
    .isString()
    .withMessage('Profile picture must be a string'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('education')
    .optional()
    .isArray()
    .withMessage('Education must be an array'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  body('availability')
    .optional()
    .isObject()
    .withMessage('Availability must be an object'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object')
];

// Reset password validation
exports.resetPasswordValidation = [
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

