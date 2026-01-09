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
  body('profileImage')
    .optional()
    .isObject()
    .withMessage('Profile image must be an object'),
  body('profileImage.url')
    .optional()
    .isString()
    .withMessage('Profile image URL must be a string'),
  body('profileImage.verified')
    .optional()
    .isBoolean()
    .withMessage('Profile image verified must be a boolean'),
  body('medicalLicense')
    .optional()
    .isObject()
    .withMessage('Medical license must be an object'),
  body('medicalLicense.licenseNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Medical license number must be between 3 and 50 characters'),
  body('medicalLicense.documentUrl')
    .optional()
    .isString()
    .withMessage('Medical license document URL must be a string'),
  body('medicalLicense.verified')
    .optional()
    .isBoolean()
    .withMessage('Medical license verified must be a boolean'),
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
    .withMessage('Address must be an object'),
  body('bankAccount')
    .optional()
    .isObject()
    .withMessage('Bank account must be an object'),
  body('bankAccount.accountHolderName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Account holder name must be between 2 and 100 characters'),
  body('bankAccount.bankName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2 and 100 characters'),
  body('bankAccount.accountNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be between 8 and 20 characters'),
  body('bankAccount.routingNumber')
    .optional()
    .isString()
    .trim()
    .matches(/^[0-9]{9}$|^[A-Z]{4}[0-9]{7}$/)
    .withMessage('Routing number must be 9 digits (US) or IFSC format (India)'),
  body('bankAccount.accountType')
    .optional()
    .isIn(['checking', 'savings', 'current'])
    .withMessage('Account type must be checking, savings, or current'),
  body('bankAccount.ifscCode')
    .optional()
    .isString()
    .trim()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('IFSC code must be in format: AAAA0XXXXXX'),
  body('bankAccount.swiftCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 8, max: 11 })
    .withMessage('SWIFT code must be between 8 and 11 characters'),
  body('bankAccount.verified')
    .optional()
    .isBoolean()
    .withMessage('Bank account verified must be a boolean')
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

// Doctor signup validation (self-registration)
exports.doctorSignupValidation = [
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
  body('middleInitial')
    .optional()
    .trim()
    .isLength({ max: 1 })
    .withMessage('Middle initial must be a single character'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Mobile number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid mobile number'),
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Country code must be a string')
    .default('+91'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('specialty')
    .notEmpty()
    .withMessage('Specialization is required')
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
    .withMessage('Invalid specialization'),
  body('licenseNumber')
    .notEmpty()
    .withMessage('Medical license number is required')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('License number must be between 3 and 50 characters'),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Years of experience must be between 0 and 100'),
  body('hospitalAffiliation')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Hospital affiliation must not exceed 200 characters'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  body('languages.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each language must be a string'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Professional bio must not exceed 1000 characters'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number')
    .default(0),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('agreeConfirmation')
    .optional()
    .isBoolean()
    .withMessage('Agree confirmation must be a boolean')
];

