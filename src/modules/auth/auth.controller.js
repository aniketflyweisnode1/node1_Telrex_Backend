const otpService = require('./otp.service');
const authService = require('./auth.service');
const loginHistoryService = require('./loginHistory.service');

// Register
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, countryCode, email, agreeConfirmation, password } = req.body;
    const finalPassword = password || phoneNumber.slice(-6);

    const user = await authService.register({ firstName, lastName, phoneNumber, countryCode, email, agreeConfirmation, password: finalPassword });

    await otpService.sendOtp(phoneNumber, countryCode);

    res.status(201).json({ success: true, message: 'Registered successfully. OTP sent.', data: { userId: user._id } });
  } catch (err) { next(err); }
};

// Verify OTP (for registration)
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;
    const user = await otpService.verifyOtp(phoneNumber, otp);
    if (!user) {
      await loginHistoryService.trackFailedLogin(req, phoneNumber, 'otp', 'Invalid or expired OTP');
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const tokens = await authService.verifyOtpAndLogin(user);
    // Get fresh user data after activation
    const freshUser = await require('../../models/User.model').findById(user._id).select('-password');
    await loginHistoryService.trackLogin(req, freshUser, 'otp');
    res.status(200).json({ success: true, message: 'OTP verified. Login successful.', data: { ...tokens, user: freshUser } });
  } catch (err) { next(err); }
};

// Resend OTP
exports.resendOtp = async (req, res, next) => {
  try {
    const { phoneNumber, countryCode } = req.body;
    const otp = await otpService.resendOtp(phoneNumber, countryCode);
    res.status(200).json({ success: true, message: 'OTP resent successfully', otp });
  } catch (err) { next(err); }
};

// Login with password
exports.login = async (req, res, next) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Email/Phone and password required' });

    const user = await authService.loginWithPassword(identifier, password);
    if (!user) {
      await loginHistoryService.trackFailedLogin(req, identifier, 'password', 'Invalid credentials');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // User is already activated in loginWithPassword, just get fresh user data
    const freshUser = await require('../../models/User.model').findById(user._id).select('-password');
    const tokens = authService.generateTokens(freshUser, rememberMe);
    await loginHistoryService.trackLogin(req, freshUser, 'password');
    res.status(200).json({ success: true, message: 'Login successful', data: { user: freshUser, tokens } });
  } catch (err) { next(err); }
};

// Login with OTP
exports.loginWithOtp = async (req, res, next) => {
  try {
    const { identifier, otp, countryCode } = req.body;
    
    // identifier can be email or phone number
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    }

    // Step 1: If OTP not provided, send OTP
    if (!otp) {
      await otpService.sendLoginOtp(identifier, countryCode || '+91');
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const message = isEmail 
        ? `OTP sent to ${identifier}` 
        : `OTP sent to ${identifier}`;
      return res.status(200).json({ 
        success: true, 
        message,
        data: { identifier, method: isEmail ? 'email' : 'phone' }
      });
    }

    // Step 2: Verify OTP and login
    const user = await otpService.verifyOtp(identifier, otp);
    if (!user) {
      await loginHistoryService.trackFailedLogin(req, identifier, 'otp', 'Invalid or expired OTP');
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Activate user on successful OTP login
    await authService.activateUser(user._id);
    const freshUser = await require('../../models/User.model').findById(user._id).select('-password');
    const tokens = authService.generateTokens(freshUser);
    await loginHistoryService.trackLogin(req, freshUser, 'otp');
    res.status(200).json({ success: true, message: 'Login successful', data: { user: freshUser, tokens } });
  } catch (err) { next(err); }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, message: 'Token refreshed', data: result });
  } catch (err) { next(err); }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    // Deactivate user (set isActive = false)
    await authService.deactivateUser(req.user.id);
    // In future, you can implement token blacklisting here
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

// Send OTP (standalone endpoint)
exports.sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber, countryCode } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number required' });
    
    await otpService.sendOtp(phoneNumber, countryCode || '+91');
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (err) { next(err); }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { phoneNumber, countryCode } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number required' });
    
    await authService.forgotPassword(phoneNumber, countryCode || '+91');
    res.status(200).json({ success: true, message: 'OTP sent to your phone number' });
  } catch (err) { next(err); }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { phoneNumber, otp, newPassword } = req.body;
    if (!phoneNumber || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone number, OTP and new password required' });
    }
    
    await authService.resetPassword(phoneNumber, otp, newPassword);
    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old password and new password required' });
    }
    
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};
