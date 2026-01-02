const User = require('../../models/User.model');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Register user
exports.register = async (data) => {
  const exists = await User.findOne({ phoneNumber: data.phoneNumber });
  if (exists) {
    logger.warn('Registration attempt with existing phone number', { phoneNumber: data.phoneNumber });
    throw new AppError('User already exists', 409);
  }

  const user = await User.create({ ...data, isVerified: false });
  logger.info('User registered successfully', {
    userId: user._id,
    phoneNumber: user.phoneNumber,
    role: user.role
  });
  return user;
};

// Login with password (email or phone)
exports.loginWithPassword = async (identifier, password) => {
  // Find user and explicitly include password
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phoneNumber: identifier }
    ]
  }).select('+password'); // ✅ IMPORTANT

  if (!user) {
    logger.warn('Login attempt failed - User not found', { identifier });
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn('Login attempt failed - Invalid password', { userId: user._id, identifier });
    return null;
  }

  // Activate user and update last login
  user.isActive = true;
  user.lastLoginAt = new Date();
  await user.save();

  // Remove password before returning
  user.password = undefined;

  logger.info('User logged in successfully', {
    userId: user._id,
    identifier,
    role: user.role,
    loginMethod: 'password'
  });

  return user;
};

// OTP login
exports.verifyOtpAndLogin = async (user) => {
  user.isVerified = true;
  user.isActive = true;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  return { user, accessToken, refreshToken };
};

// Generate tokens for login
exports.generateTokens = (user, rememberMe = false) => {
  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = rememberMe ? generateRefreshToken({ id: user._id, role: user.role }) : null;
  return { accessToken, refreshToken };
};

// Refresh access token
exports.refreshAccessToken = async (refreshToken) => {
  const { verifyRefreshToken } = require('../../utils/jwt');
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new AppError('User not found', 404);
    
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    return { accessToken, user };
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};

// Forgot password - send OTP
exports.forgotPassword = async (phoneNumber, countryCode) => {
  const user = await User.findOne({ phoneNumber });
  if (!user) throw new AppError('User not found', 404);
  
  const otpService = require('./otp.service');
  await otpService.sendOtp(phoneNumber, countryCode);
  return { message: 'OTP sent to your phone number' };
};

// Reset password with OTP
exports.resetPassword = async (phoneNumber, otp, newPassword) => {
  const otpService = require('./otp.service');
  const user = await otpService.verifyOtp(phoneNumber, otp);
  
  if (!user) throw new AppError('Invalid or expired OTP', 400);
  
  user.password = newPassword;
  await user.save();
  
  return { message: 'Password reset successfully' };
};

// Change password (requires old password)
exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);
  
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);
  
  user.password = newPassword;
  await user.save();
  
  return { message: 'Password changed successfully' };
};

// Activate user (set isActive = true)
exports.activateUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  user.isActive = true;
  user.lastLoginAt = new Date();
  await user.save();
  
  return user;
};

// Deactivate user (set isActive = false) - for logout
exports.deactivateUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  user.isActive = false;
  await user.save();
  
  return user;
};