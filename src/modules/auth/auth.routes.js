const router = require('express').Router();
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const auth = require('../../middlewares/auth.middleware');
const {
  registerValidation,
  otpValidation,
  loginValidation,
  loginOtpValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  sendOtpValidation,
  googleLoginValidation,
  facebookLoginValidation
} = require('./auth.validation');
const doctorController = require('../doctor/doctor.controller');
const doctorValidation = require('../doctor/doctor.validation');

// Registration & OTP
router.post('/register', registerValidation, validate, controller.register);
router.post('/verify-otp', otpValidation, validate, controller.verifyOtp);
router.post('/resend-otp', controller.resendOtp);
router.post('/send-otp', sendOtpValidation, validate, controller.sendOtp);

// Doctor Registration (Public - No Admin Required)
router.post('/doctor/register', doctorValidation.doctorSignupValidation, validate, doctorController.doctorSignup);

// Login
router.post('/login', loginValidation, validate, controller.login);        // Email/Phone + Password
router.post('/login-password', loginValidation, validate, controller.login); // Alias
router.post('/login-otp', loginOtpValidation, validate, controller.loginWithOtp); // OTP login
router.post('/login-google', googleLoginValidation, validate, controller.loginWithGoogle); // Google OAuth login
router.post('/login-facebook', facebookLoginValidation, validate, controller.loginWithFacebook); // Facebook OAuth login

// Doctor Login
router.post('/doctor/login', loginValidation, validate, controller.doctorLogin); // Doctor login with Email/Phone + Password

// Password Management
router.post('/forgot-password', forgotPasswordValidation, validate, controller.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, controller.resetPassword);
router.put('/change-password', auth, changePasswordValidation, validate, controller.changePassword);

// Token management
router.post('/refresh-token', refreshTokenValidation, validate, controller.refreshToken);
router.post('/logout', auth, controller.logout);

module.exports = router;
