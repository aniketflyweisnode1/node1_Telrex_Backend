/**
 * OTP Service - Refactored with helpers and optimized
 */

const Otp = require('../../models/Otp.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');
const emailService = require('../../utils/email.service');
const smsService = require('../../utils/sms.service');
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
  const user = await User.findOne({ phoneNumber }).select('email').lean();
  if (!user) throw new AppError('User not found', 404);

  const otpCode = await upsertOtp(
    { phoneNumber },
    { phoneNumber, countryCode, type: 'phone' }
  );

  let smsSent = false;
  let emailSent = false;

  // Send via SMS
  try {
    await smsService.sendOtpSMS(phoneNumber, otpCode);
    console.log(`📲 Registration OTP sent via SMS to ${phoneNumber}`);
    smsSent = true;
  } catch (error) {
    console.error(`Failed to send Registration OTP SMS to ${phoneNumber}:`, error.message);
  }

  // Also send via Email if available
  if (user.email) {
    try {
      await emailService.sendOtpEmail(user.email, otpCode, 'login');
      console.log(`📧 Registration OTP also sent to email ${user.email}`);
      emailSent = true;
    } catch (error) {
      console.error(`Failed to send Registration OTP email to ${user.email}:`, error.message);
    }
  }

  // If both SMS and email failed, return default OTP
  if (!smsSent && (!user.email || !emailSent)) {
    console.log(`📲 Using default OTP '123456' for registration as delivery failed`);
    return '123456';
  }

  return otpCode;
};

/**
 * Send OTP for login (accepts email or phone)
 */
exports.sendLoginOtp = async (identifier, countryCode) => {
  // Verify user exists
  const user = await User.findOne(buildIdentifierOrQuery(identifier)).select('_id email phoneNumber').lean();
  if (!user) throw new AppError('User not found. Please register first.', 404);

  const isEmailId = isEmail(identifier);
  const normalized = normalizeIdentifier(identifier);

  const query = isEmailId ? { email: normalized } : { phoneNumber: identifier };
  const otpData = isEmailId
    ? { email: normalized, type: 'email' }
    : { phoneNumber: identifier, countryCode, type: 'phone' };

  const otpCode = await upsertOtp(query, otpData);

  let smsSent = false;
  let emailSent = false;

  // Send OTP (Try both email and SMS if user data allows)
  const sendEmail = isEmailId ? normalized : user.email;
  const sendPhone = isEmailId ? user.phoneNumber : identifier;

  if (sendPhone) {
    try {
      await smsService.sendOtpSMS(sendPhone, otpCode);
      console.log(`📲 Login OTP sent via SMS to ${sendPhone}`);
      smsSent = true;
    } catch (error) {
      console.error(`Failed to send Login OTP SMS to ${sendPhone}:`, error.message);
    }
  }

  if (sendEmail) {
    try {
      await emailService.sendOtpEmail(sendEmail, otpCode, 'login');
      console.log(`📧 Login OTP sent to email ${sendEmail}`);
      emailSent = true;
    } catch (error) {
      console.error(`Failed to send Login OTP email to ${sendEmail}:`, error.message);
    }
  }

  // If both SMS and email failed, return default OTP
  if (!smsSent && !emailSent) {
    console.log(`📲 Using default OTP '123456' for login as delivery failed`);
    return '123456';
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

  // Send OTP (Try both email and SMS if user data allows)
  const sendEmail = isEmailId ? normalized : user.email;
  const sendPhone = isEmailId ? user.phoneNumber : identifier;

  if (sendPhone) {
    try {
      await smsService.sendOtpSMS(sendPhone, otpCode);
      console.log(`📲 Password reset OTP sent via SMS to ${sendPhone}`);
    } catch (error) {
      console.error(`Failed to send Password Reset OTP SMS to ${sendPhone}:`, error.message);
    }
  }

  if (sendEmail) {
    try {
      await emailService.sendOtpEmail(sendEmail, otpCode, 'password-reset');
      console.log(`📧 Password reset OTP sent to email ${sendEmail}`);
    } catch (error) {
      console.error(`Failed to send Password Reset OTP email to ${sendEmail}:`, error.message);
    }
  }

  return otpCode;
};

/**
 * Verify OTP (accepts email or phone) - BYPASSED BY DEFAULT
 */
exports.verifyOtp = async (identifier, otp) => {
  // Bypass OTP verification: always verify the user if they exist
  const user = await User.findOneAndUpdate(
    buildIdentifierOrQuery(identifier),
    { $set: { isVerified: true } },
    { new: true }
  ).select('-password').lean();

  return user || false;
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
