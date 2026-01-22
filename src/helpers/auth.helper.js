/**
 * Auth Helper - Shared utilities for authentication operations
 * Optimized for performance and reusability
 */

const User = require('../models/User.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Check if identifier is email
 * @param {string} identifier - Email or phone
 * @returns {boolean}
 */
const isEmail = (identifier) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

/**
 * Normalize identifier (trim, lowercase email)
 * @param {string} identifier - Email or phone
 * @returns {string} Normalized identifier
 */
const normalizeIdentifier = (identifier) => {
  if (!identifier) return '';
  const trimmed = identifier.trim();
  return isEmail(trimmed) ? trimmed.toLowerCase() : trimmed;
};

/**
 * Build query for finding user by identifier
 * @param {string} identifier - Email or phone
 * @returns {Object} MongoDB query object
 */
const buildIdentifierQuery = (identifier) => {
  const normalized = normalizeIdentifier(identifier);
  return isEmail(normalized)
    ? { email: normalized }
    : { phoneNumber: normalized };
};

/**
 * Build OR query for email/phone
 * @param {string} identifier - Email or phone
 * @returns {Object} MongoDB $or query
 */
const buildIdentifierOrQuery = (identifier) => {
  const normalized = normalizeIdentifier(identifier);
  return {
    $or: [
      { email: normalized },
      { phoneNumber: identifier.trim() }
    ]
  };
};

/**
 * Validate password format (bcrypt hash check)
 * @param {string} password - Password hash
 * @returns {boolean}
 */
const isValidBcryptHash = (password) => /^\$2[aby]\$\d{2}\$/.test(password);

// =============================================
// USER HELPERS
// =============================================

/**
 * Find user by identifier (email or phone)
 * @param {string} identifier - Email or phone
 * @param {Object} options - { select: '+password', lean: false }
 * @returns {Object|null} User document
 */
const findUserByIdentifier = async (identifier, options = {}) => {
  const { select = '-password', lean = false, additionalFilters = {} } = options;
  
  let query = User.findOne({
    ...buildIdentifierOrQuery(identifier),
    ...additionalFilters
  });
  
  if (select) query = query.select(select);
  if (lean) query = query.lean();
  
  return await query;
};

/**
 * Activate user and update last login (single DB call)
 * @param {string} userId - User ID
 * @param {Object} additionalUpdates - Additional fields to update
 * @returns {Object} Updated user
 */
const activateUser = async (userId, additionalUpdates = {}) => {
  return await User.findByIdAndUpdate(
    userId,
    { 
      $set: { 
        isActive: true, 
        lastLoginAt: new Date(),
        ...additionalUpdates
      } 
    },
    { new: true }
  ).select('-password').lean();
};

/**
 * Verify and activate user (mark as verified + active)
 * @param {string} userId - User ID
 * @returns {Object} Updated user
 */
const verifyAndActivateUser = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { 
      $set: { 
        isActive: true, 
        isVerified: true,
        lastLoginAt: new Date()
      } 
    },
    { new: true }
  ).select('-password').lean();
};

/**
 * Deactivate user (for logout)
 * @param {string} userId - User ID
 * @returns {Object} Updated user
 */
const deactivateUser = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { $set: { isActive: false } },
    { new: true }
  ).select('-password').lean();
};

// =============================================
// PASSWORD HELPERS
// =============================================

/**
 * Verify password against hash
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Bcrypt hash
 * @returns {boolean}
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  if (!isValidBcryptHash(hashedPassword)) return false;
  
  try {
    return await bcrypt.compare(plainPassword.trim(), hashedPassword);
  } catch {
    return false;
  }
};

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {string} Bcrypt hash
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// =============================================
// TOKEN HELPERS
// =============================================

/**
 * Generate access and refresh tokens
 * @param {Object} user - User document
 * @param {boolean} rememberMe - Generate refresh token
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (user, rememberMe = false) => {
  const payload = { id: user._id || user.id, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: rememberMe ? generateRefreshToken(payload) : null
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} { accessToken, user }
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('-password').lean();
    
    if (!user) throw new AppError('User not found', 404);
    
    return {
      accessToken: generateAccessToken({ id: user._id, role: user.role }),
      user
    };
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};

// =============================================
// OTP HELPERS
// =============================================

/**
 * Generate 6-digit OTP
 * @returns {string} OTP code
 */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Get OTP expiry date
 * @param {number} minutes - Expiry in minutes (default from env)
 * @returns {Date} Expiry date
 */
const getOtpExpiry = (minutes = parseInt(process.env.OTP_EXPIRE_MINUTES || 10)) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// =============================================
// SOCIAL LOGIN HELPERS
// =============================================

/**
 * Process social login (Google/Facebook)
 * @param {Object} profile - Social profile { socialId, email, firstName, lastName, provider }
 * @param {string} socialIdField - Field name (googleId or facebookId)
 * @returns {Object} User document
 */
const processSocialLogin = async (profile, socialIdField) => {
  const { socialId, email, firstName, lastName, provider } = profile;
  
  if (!email) {
    throw new AppError(`Email not provided by ${provider}`, 400);
  }
  
  const normalizedEmail = email.toLowerCase();
  
  // Check if user exists with this social ID
  let user = await User.findOne({ [socialIdField]: socialId });
  
  if (user) {
    // Update existing user
    user.email = normalizedEmail;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.isActive = true;
    user.isVerified = true;
    user.lastLoginAt = new Date();
    user.authProvider = provider;
    await user.save();
    user.password = undefined;
    return user;
  }
  
  // Check if user exists with this email
  user = await User.findOne({ email: normalizedEmail });
  
  if (user) {
    // Link social account
    if (user[socialIdField] && user[socialIdField] !== socialId) {
      throw new AppError(`This email is already associated with another ${provider} account`, 409);
    }
    
    user[socialIdField] = socialId;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.isActive = true;
    user.isVerified = true;
    user.lastLoginAt = new Date();
    user.authProvider = provider;
    await user.save();
    user.password = undefined;
    return user;
  }
  
  // Create new user
  const randomPassword = Math.random().toString(36).slice(-12) + Date.now().toString(36);
  
  user = await User.create({
    firstName: firstName || 'User',
    lastName: lastName || '',
    email: normalizedEmail,
    phoneNumber: `${provider}_${socialId}`,
    countryCode: '+1',
    password: randomPassword,
    [socialIdField]: socialId,
    authProvider: provider,
    isVerified: true,
    isActive: true,
    agreeConfirmation: true,
    lastLoginAt: new Date()
  });
  
  user.password = undefined;
  return user;
};

/**
 * Generate random password for social logins
 * @returns {string} Random password
 */
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-12) + Date.now().toString(36);
};

// =============================================
// RESPONSE FORMATTERS
// =============================================

/**
 * Format user for API response (remove sensitive data)
 * @param {Object} user - User document
 * @returns {Object} Sanitized user
 */
const formatUserResponse = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

/**
 * Format login response
 * @param {Object} user - User document
 * @param {Object} tokens - { accessToken, refreshToken }
 * @param {Object} additionalData - Extra data to include
 * @returns {Object} Formatted response
 */
const formatLoginResponse = (user, tokens, additionalData = {}) => {
  return {
    user: formatUserResponse(user),
    tokens,
    ...additionalData
  };
};

module.exports = {
  // Validation
  isEmail,
  normalizeIdentifier,
  buildIdentifierQuery,
  buildIdentifierOrQuery,
  isValidBcryptHash,
  
  // User operations
  findUserByIdentifier,
  activateUser,
  verifyAndActivateUser,
  deactivateUser,
  
  // Password
  verifyPassword,
  hashPassword,
  
  // Tokens
  generateTokens,
  refreshAccessToken,
  
  // OTP
  generateOtp,
  getOtpExpiry,
  
  // Social login
  processSocialLogin,
  generateRandomPassword,
  
  // Response formatters
  formatUserResponse,
  formatLoginResponse
};

