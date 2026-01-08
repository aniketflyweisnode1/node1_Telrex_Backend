const { body } = require('express-validator');

exports.registerValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('countryCode').notEmpty().withMessage('Country code is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('agreeConfirmation').equals('true').withMessage('You must agree to the terms')
];

exports.otpValidation = [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

exports.loginValidation = [
  body('identifier').notEmpty().withMessage('Email or phone number is required'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.loginOtpValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required')
    .custom((value) => {
      // Check if it's a valid email or phone number
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^[0-9]{10,15}$/.test(value.replace(/[^0-9]/g, ''));
      if (!isEmail && !isPhone) {
        throw new Error('Please provide a valid email or phone number');
      }
      return true;
    }),
  body('otp')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('countryCode')
    .optional()
    .isString()
    .withMessage('Country code must be a string')
];

exports.refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

exports.forgotPasswordValidation = [
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
];

exports.resetPasswordValidation = [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

exports.sendOtpValidation = [
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
];

exports.googleLoginValidation = [
  body('googleToken')
    .notEmpty()
    .withMessage('Google token is required')
    .isString()
    .withMessage('Google token must be a string'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean')
];

exports.facebookLoginValidation = [
  body('facebookToken')
    .notEmpty()
    .withMessage('Facebook token is required')
    .isString()
    .withMessage('Facebook token must be a string'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean')
];