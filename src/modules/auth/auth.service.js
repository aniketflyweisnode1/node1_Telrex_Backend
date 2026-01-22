/**
 * Auth Service - Refactored with helpers and optimized
 */

const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const {
  isEmail,
  normalizeIdentifier,
  buildIdentifierOrQuery,
  findUserByIdentifier,
  activateUser,
  verifyPassword,
  generateTokens,
  refreshAccessToken,
  processSocialLogin,
  isValidBcryptHash
} = require('../../helpers');

// =============================================
// REGISTRATION
// =============================================

/**
 * Register new user
 */
exports.register = async (data) => {
  const exists = await User.exists({ phoneNumber: data.phoneNumber });
  if (exists) {
    logger.warn('Registration attempt with existing phone', { phoneNumber: data.phoneNumber });
    throw new AppError('User already exists', 409);
  }

  const user = await User.create({ ...data, isVerified: false });
  logger.info('User registered', { userId: user._id, phone: user.phoneNumber, role: user.role });
  return user;
};

// =============================================
// LOGIN METHODS
// =============================================

/**
 * Login with password (email or phone)
 */
exports.loginWithPassword = async (identifier, password) => {
  const user = await findUserByIdentifier(identifier, { select: '+password' });
  
  if (!user) {
    logger.warn('Login failed - User not found', { identifier });
    return null;
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    logger.warn('Login failed - Invalid password', { userId: user._id });
    return null;
  }

  // Activate and return user (single DB call)
  const activatedUser = await activateUser(user._id);
  logger.info('User logged in', { userId: user._id, method: 'password' });
  
  return activatedUser;
};

/**
 * Doctor login with password
 */
exports.doctorLoginWithPassword = async (identifier, password) => {
  const Doctor = require('../../models/Doctor.model');
  
  if (!identifier) throw new AppError('Email or phone number is required', 400);
  
  const normalized = normalizeIdentifier(identifier);
  const isEmailId = isEmail(normalized);
  
  // Build query based on identifier type
  const queryConditions = isEmailId 
    ? [{ email: normalized }]
    : [{ phoneNumber: normalized.replace(/[^0-9]/g, '') }];
  
  if (!isEmailId && queryConditions[0].phoneNumber.length < 10) {
    throw new AppError('Please provide a valid email or phone number', 400);
  }

  // Find user with password
  const user = await User.findOne({
    $or: queryConditions,
    role: 'doctor'
  }).select('+password');
  
  if (!user) {
    // Check if user exists but not a doctor
    const anyUser = await User.exists({ $or: queryConditions });
    if (anyUser) {
      logger.warn('Doctor login failed - Not a doctor account', { identifier });
      throw new AppError('Invalid credentials or not a doctor account', 401);
    }
    logger.warn('Doctor login failed - User not found', { identifier });
    throw new AppError('Invalid credentials', 401);
  }

  // Validate password
  if (!password?.trim()) throw new AppError('Password is required', 400);
  if (!user.password) throw new AppError('Password not set. Please use forgot password.', 401);
  if (!isValidBcryptHash(user.password)) throw new AppError('Password format error. Please reset.', 500);

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    logger.warn('Doctor login failed - Invalid password', { userId: user._id });
    throw new AppError('Invalid credentials', 401);
  }

  // Check doctor profile exists
  const doctor = await Doctor.findOne({ user: user._id })
    .populate('user', 'firstName lastName email phoneNumber countryCode role isActive isVerified')
    .lean();

  if (!doctor) {
    logger.warn('Doctor login failed - Profile not found', { userId: user._id });
    throw new AppError('Doctor profile not found. Please contact administrator.', 404);
  }

  // Activate user
  const activatedUser = await activateUser(user._id);
  logger.info('Doctor logged in', { userId: user._id, doctorId: doctor._id });

  return { user: activatedUser, doctor };
};

/**
 * Verify OTP and login (used after OTP verification)
 */
exports.verifyOtpAndLogin = async (user) => {
  const activatedUser = await activateUser(user._id, { isVerified: true });
  const tokens = generateTokens(activatedUser);
  return { user: activatedUser, ...tokens };
};

// =============================================
// TOKEN MANAGEMENT
// =============================================

exports.generateTokens = generateTokens;
exports.refreshAccessToken = refreshAccessToken;

// =============================================
// USER STATUS
// =============================================

/**
 * Activate user
 */
exports.activateUser = activateUser;

/**
 * Deactivate user (logout)
 */
exports.deactivateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isActive: false } },
    { new: true }
  ).select('-password').lean();
  
  if (!user) throw new AppError('User not found', 404);
  return user;
};

// =============================================
// PASSWORD MANAGEMENT
// =============================================

/**
 * Forgot password - send OTP
 */
exports.forgotPassword = async (identifier, countryCode) => {
  const otpService = require('./otp.service');
  const otpCode = await otpService.sendPasswordResetOtp(identifier, countryCode);
  
  return { 
    message: isEmail(identifier) ? 'OTP sent to your email address' : 'OTP sent to your phone number',
    otp: otpCode 
  };
};

/**
 * Reset password with OTP
 */
exports.resetPassword = async (identifier, otp, newPassword) => {
  const otpService = require('./otp.service');
  const user = await otpService.verifyOtp(identifier, otp);
  
  if (!user) throw new AppError('Invalid or expired OTP', 400);
  
  // Update password directly (User model will hash it)
  await User.findByIdAndUpdate(user._id, { password: newPassword });
  
  return { message: 'Password reset successfully' };
};

/**
 * Change password (requires old password)
 */
exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);
  
  const isMatch = await verifyPassword(oldPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);
  
  user.password = newPassword;
  await user.save();
  
  return { message: 'Password changed successfully' };
};

// =============================================
// SOCIAL LOGIN
// =============================================

/**
 * Google OAuth Login (ID Token)
 */
exports.loginWithGoogle = async (googleToken) => {
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { sub: googleId, email, given_name: firstName, family_name: lastName } = ticket.getPayload();
    
    const user = await processSocialLogin({
      socialId: googleId,
      email,
      firstName,
      lastName,
      provider: 'google'
    }, 'googleId');
    
    logger.info('Google login successful', { userId: user._id, email });
    return user;
    
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Google login failed', { error: err.message });
    throw new AppError('Invalid Google token or authentication failed', 401);
  }
};

/**
 * Google OAuth Login (Authorization Code)
 */
exports.loginWithGoogleCode = async (code) => {
  const { OAuth2Client } = require('google-auth-library');
  const axios = require('axios');
  
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback'
  );
  
  try {
    const { tokens } = await client.getToken(code);
    
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    const user = await processSocialLogin({
      socialId: data.id,
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
      provider: 'google'
    }, 'googleId');
    
    logger.info('Google login (code flow) successful', { userId: user._id, email: data.email });
    return user;
    
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Google login (code) failed', { error: err.message });
    throw new AppError('Invalid authorization code or Google authentication failed', 401);
  }
};

/**
 * Facebook OAuth Login
 */
exports.loginWithFacebook = async (facebookToken) => {
  const axios = require('axios');
  
  try {
    const { data } = await axios.get('https://graph.facebook.com/me', {
      params: {
        access_token: facebookToken,
        fields: 'id,name,email,first_name,last_name,picture'
      }
    });
    
    const { id: facebookId, email, first_name, last_name, name } = data;
    
    const user = await processSocialLogin({
      socialId: facebookId,
      email,
      firstName: first_name || name?.split(' ')[0] || 'User',
      lastName: last_name || name?.split(' ').slice(1).join(' ') || '',
      provider: 'facebook'
    }, 'facebookId');
    
    logger.info('Facebook login successful', { userId: user._id, email });
    return user;
    
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Facebook login failed', { error: err.message });
    throw new AppError('Invalid Facebook token or authentication failed', 401);
  }
};
