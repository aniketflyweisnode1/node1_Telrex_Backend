const Otp = require('../../models/Otp.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');
const emailService = require('../../utils/email.service');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to check if identifier is email
const isEmail = (identifier) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
};

// Send OTP for registration (requires user to exist)
exports.sendOtp = async (phoneNumber, countryCode) => {
  const user = await User.findOne({ phoneNumber });
  if (!user) throw new AppError('User not found', 404);

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

  let otpDoc = await Otp.findOne({ phoneNumber });
  if (otpDoc) {
    otpDoc.otp = otpCode;
    otpDoc.expiresAt = expiresAt;
    otpDoc.countryCode = countryCode;
  } else {
    otpDoc = new Otp({ phoneNumber, countryCode, otp: otpCode, expiresAt });
  }

  await otpDoc.save();
  console.log(`📲 OTP for ${phoneNumber}: ${otpCode}`);
  return otpCode;
};

// Send OTP for login (accepts email or phone)
exports.sendLoginOtp = async (identifier, countryCode) => {
  // Find user by email or phone
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phoneNumber: identifier }
    ]
  });

  if (!user) throw new AppError('User not found. Please register first.', 404);

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

  const isEmailIdentifier = isEmail(identifier);
  const query = isEmailIdentifier ? { email: identifier.toLowerCase() } : { phoneNumber: identifier };
  
  let otpDoc = await Otp.findOne(query);
  if (otpDoc) {
    otpDoc.otp = otpCode;
    otpDoc.expiresAt = expiresAt;
    otpDoc.type = isEmailIdentifier ? 'email' : 'phone';
    if (!isEmailIdentifier && countryCode) {
      otpDoc.countryCode = countryCode;
    }
  } else {
    const otpData = {
      otp: otpCode,
      expiresAt,
      type: isEmailIdentifier ? 'email' : 'phone'
    };
    if (isEmailIdentifier) {
      otpData.email = identifier.toLowerCase();
    } else {
      otpData.phoneNumber = identifier;
      if (countryCode) otpData.countryCode = countryCode;
    }
    otpDoc = new Otp(otpData);
  }

  await otpDoc.save();

  // Send OTP via email or phone
  if (isEmailIdentifier) {
    await emailService.sendOtpEmail(identifier.toLowerCase(), otpCode, 'login');
    console.log(`📧 Login OTP sent to email ${identifier}`);
  } else {
    console.log(`📲 Login OTP for ${identifier}: ${otpCode}`);
  }

  return otpCode;
};

// Send OTP for password reset (accepts email or phone)
exports.sendPasswordResetOtp = async (identifier, countryCode) => {
  // Find user by email or phone
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phoneNumber: identifier }
    ]
  });

  if (!user) throw new AppError('User not found', 404);

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

  const isEmailIdentifier = isEmail(identifier);
  const query = isEmailIdentifier ? { email: identifier.toLowerCase() } : { phoneNumber: identifier };
  
  let otpDoc = await Otp.findOne(query);
  if (otpDoc) {
    otpDoc.otp = otpCode;
    otpDoc.expiresAt = expiresAt;
    otpDoc.type = isEmailIdentifier ? 'email' : 'phone';
    if (!isEmailIdentifier && countryCode) {
      otpDoc.countryCode = countryCode;
    }
  } else {
    const otpData = {
      otp: otpCode,
      expiresAt,
      type: isEmailIdentifier ? 'email' : 'phone'
    };
    if (isEmailIdentifier) {
      otpData.email = identifier.toLowerCase();
    } else {
      otpData.phoneNumber = identifier;
      if (countryCode) otpData.countryCode = countryCode;
    }
    otpDoc = new Otp(otpData);
  }

  await otpDoc.save();

  // Send OTP via email or phone
  if (isEmailIdentifier) {
    await emailService.sendOtpEmail(identifier.toLowerCase(), otpCode, 'password-reset');
    console.log(`📧 Password reset OTP sent to email ${identifier}`);
  } else {
    console.log(`📲 Password reset OTP for ${identifier}: ${otpCode}`);
  }

  return otpCode;
};

// Verify OTP (accepts email or phone)
exports.verifyOtp = async (identifier, otp) => {
  const isEmailIdentifier = isEmail(identifier);
  const query = isEmailIdentifier 
    ? { email: identifier.toLowerCase() } 
    : { phoneNumber: identifier };

  const otpDoc = await Otp.findOne(query);
  if (!otpDoc) return false;

  if (otpDoc.otp !== otp.toString() || otpDoc.expiresAt < new Date()) {
    console.log(`❌ OTP mismatch or expired: entered=${otp}, saved=${otpDoc.otp}`);
    return false;
  }

  await Otp.deleteOne({ _id: otpDoc._id });

  // Find user by email or phone
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phoneNumber: identifier }
    ]
  });

  if (user) {
    user.isVerified = true;
    await user.save();
  }

  return user;
};

exports.resendOtp = async (phoneNumber, countryCode) => {
  const otpDoc = await Otp.findOne({ phoneNumber });
  if (otpDoc) {
    const diffMinutes = (new Date() - otpDoc.updatedAt) / 1000 / 60;
    if (diffMinutes < 1) throw new AppError('Wait at least 1 minute before requesting new OTP', 429);
  }

  return await exports.sendOtp(phoneNumber, countryCode);
};
