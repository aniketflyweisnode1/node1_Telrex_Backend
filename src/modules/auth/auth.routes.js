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
  sendOtpValidation
} = require('./auth.validation');

// Registration & OTP
router.post('/register', registerValidation, validate, controller.register);
router.post('/verify-otp', otpValidation, validate, controller.verifyOtp);
router.post('/resend-otp', controller.resendOtp);
router.post('/send-otp', sendOtpValidation, validate, controller.sendOtp);

// Login
router.post('/login', loginValidation, validate, controller.login);        // Email/Phone + Password
router.post('/login-password', loginValidation, validate, controller.login); // Alias
router.post('/login-otp', loginOtpValidation, validate, controller.loginWithOtp); // OTP login

// Password Management
router.post('/forgot-password', forgotPasswordValidation, validate, controller.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, controller.resetPassword);
router.put('/change-password', auth, changePasswordValidation, validate, controller.changePassword);

// Token management
router.post('/refresh-token', refreshTokenValidation, validate, controller.refreshToken);
router.post('/logout', auth, controller.logout);

module.exports = router;
