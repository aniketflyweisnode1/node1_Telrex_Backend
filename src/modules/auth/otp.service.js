/**
 * OTP Service - Refactored with helpers and optimized
 */

const Otp = require('../../models/Otp.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');
const emailService = require('../../utils/email.service');
const {
  isEmail,
  normalizeIdentifier,
  buildIdentifierQuery,
  buildIdentifierOrQuery,
  generateOtp,
  getOtpExpiry
} = require('../../helpers');

/**
 * Create or update OTP document
 * @private
 */
const upsertOtp = async (query, otpData) => {
  const otpCode = generateOtp();
  const expiresAt = getOtpExpiry();
  
  const update = {
    otp: otpCode,
    expiresAt,
    ...otpData
  };
  
  await Otp.findOneAndUpdate(
    query,
    { $set: update },
    { upsert: true, new: true }
  );
  
  return otpCode;
};

/**
 * Send OTP for registration (requires user to exist)
 */
exports.sendOtp = async (phoneNumber, countryCode) => {
  const userExists = await User.exists({ phoneNumber });
  if (!userExists) throw new AppError('User not found', 404);

  const otpCode = await upsertOtp(
    { phoneNumber },
    { phoneNumber, countryCode, type: 'phone' }
  );

  console.log(`📲 OTP for ${phoneNumber}: ${otpCode}`);
  return otpCode;
};

/**
 * Send OTP for login (accepts email or phone)
 */
exports.sendLoginOtp = async (identifier, countryCode) => {
  // Verify user exists
  const user = await User.findOne(buildIdentifierOrQuery(identifier)).select('_id').lean();
  if (!user) throw new AppError('User not found. Please register first.', 404);

  const isEmailId = isEmail(identifier);
  const normalized = normalizeIdentifier(identifier);
  
  const query = isEmailId ? { email: normalized } : { phoneNumber: identifier };
  const otpData = isEmailId 
    ? { email: normalized, type: 'email' }
    : { phoneNumber: identifier, countryCode, type: 'phone' };

  const otpCode = await upsertOtp(query, otpData);

  // Send OTP
  if (isEmailId) {
    await emailService.sendOtpEmail(normalized, otpCode, 'login');
    console.log(`📧 Login OTP sent to email ${identifier}`);
  } else {
    console.log(`📲 Login OTP for ${identifier}: ${otpCode}`);
  }

  return otpCode;
};

/**
 * Send OTP for password reset (accepts email or phone)
 */
exports.sendPasswordResetOtp = async (identifier, countryCode) => {
  // Verify user exists
  const user = await User.findOne(buildIdentifierOrQuery(identifier)).select('_id').lean();
  if (!user) throw new AppError('User not found', 404);

  const isEmailId = isEmail(identifier);
  const normalized = normalizeIdentifier(identifier);
  
  const query = isEmailId ? { email: normalized } : { phoneNumber: identifier };
  const otpData = isEmailId 
    ? { email: normalized, type: 'email' }
    : { phoneNumber: identifier, countryCode, type: 'phone' };

  const otpCode = await upsertOtp(query, otpData);

  // Send OTP
  if (isEmailId) {
    await emailService.sendOtpEmail(normalized, otpCode, 'password-reset');
    console.log(`📧 Password reset OTP sent to email ${identifier}`);
  } else {
    console.log(`📲 Password reset OTP for ${identifier}: ${otpCode}`);
  }

  return otpCode;
};

/**
 * Verify OTP (accepts email or phone) - OPTIMIZED
 */
exports.verifyOtp = async (identifier, otp) => {
  const isEmailId = isEmail(identifier);
  const normalized = normalizeIdentifier(identifier);
  
  const otpQuery = isEmailId ? { email: normalized } : { phoneNumber: identifier };

  // Find and delete OTP in single atomic operation
  const otpDoc = await Otp.findOneAndDelete({
    ...otpQuery,
    otp: otp.toString(),
    expiresAt: { $gt: new Date() }
  }).lean();

  if (!otpDoc) return false;

  // Update user as verified and return (single DB call)
  const user = await User.findOneAndUpdate(
    buildIdentifierOrQuery(identifier),
    { $set: { isVerified: true } },
    { new: true }
  ).select('-password').lean();

  return user;
};

/**
 * Resend OTP with rate limiting
 */
exports.resendOtp = async (phoneNumber, countryCode) => {
  const otpDoc = await Otp.findOne({ phoneNumber }).select('updatedAt').lean();
  
  if (otpDoc) {
    const diffMinutes = (Date.now() - new Date(otpDoc.updatedAt).getTime()) / 1000 / 60;
    if (diffMinutes < 1) {
      throw new AppError('Wait at least 1 minute before requesting new OTP', 429);
    }
  }

  return await exports.sendOtp(phoneNumber, countryCode);
};
