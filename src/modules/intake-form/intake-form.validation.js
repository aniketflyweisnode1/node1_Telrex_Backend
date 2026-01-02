const { body } = require('express-validator');

// Basic Information Validation
exports.basicInformationValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('sex').isIn(['male', 'female', 'other']).withMessage('Sex must be male, female, or other'),
  body('dateOfBirth').isISO8601().withMessage('Date of birth must be a valid date'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('zip').optional().isString().withMessage('Zip must be a string'),
  body('maritalStatus').optional().isIn(['single', 'married', 'divorced', 'widowed', 'separated']).withMessage('Invalid marital status'),
  body('govtIssuedCertificate').optional().isIn(['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id', 'other']).withMessage('Invalid certificate type'),
  body('certificateUpload').optional().isString().withMessage('Certificate upload must be a string (URL or path)')
];

// Emergency Contact Validation
exports.emergencyContactValidation = [
  body('relationship').notEmpty().withMessage('Relationship is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phone').notEmpty().isString().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('primaryPhone').optional().isString().withMessage('Primary phone must be a string'),
  body('workPhone').optional().isString().withMessage('Work phone must be a string'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('zip').optional().isString().withMessage('Zip must be a string')
];

// Medical Questions Validation
exports.medicalQuestionsValidation = [
  body('pastMedicalHistory').optional().isArray().withMessage('Past medical history must be an array'),
  body('pastMedicalHistory.*').optional().isString().withMessage('Each medical history item must be a string'),
  body('currentMedications').optional().isArray().withMessage('Current medications must be an array'),
  body('currentMedications.*').optional().isString().withMessage('Each medication must be a string'),
  body('medicationAllergies').optional().isArray().withMessage('Medication allergies must be an array'),
  body('medicationAllergies.*').optional().isString().withMessage('Each allergy must be a string'),
  body('preferredPharmacies').optional().isArray().withMessage('Preferred pharmacies must be an array'),
  body('preferredPharmacies.*.pharmacyName').optional().isString().withMessage('Pharmacy name must be a string'),
  body('preferredPharmacies.*.address').optional().isString().withMessage('Pharmacy address must be a string'),
  body('preferredPharmacies.*.city').optional().isString().withMessage('Pharmacy city must be a string'),
  body('preferredPharmacies.*.state').optional().isString().withMessage('Pharmacy state must be a string'),
  body('preferredPharmacies.*.zip').optional().isPostalCode('any').withMessage('Invalid pharmacy zip code'),
  body('howDidYouHearAboutUs').optional().isString().withMessage('How did you hear about us must be a string')
];

