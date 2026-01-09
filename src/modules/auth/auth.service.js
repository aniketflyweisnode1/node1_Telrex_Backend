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

// Doctor login with password
exports.doctorLoginWithPassword = async (identifier, password) => {
  const Doctor = require('../../models/Doctor.model');
  
  // Normalize identifier (trim whitespace)
  if (!identifier) {
    logger.warn('Doctor login attempt failed - No identifier provided');
    throw new AppError('Email or phone number is required', 400);
  }
  
  const normalizedIdentifier = identifier.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
  
  // Build query based on identifier type
  // If it's an email, check email field; if it's a phone, check phone field
  const queryConditions = [];
  
  if (isEmail) {
    // If identifier is an email, check email field (normalized to lowercase)
    queryConditions.push({ email: normalizedIdentifier.toLowerCase() });
  } else {
    // If identifier is a phone number, check phone field (normalized - remove non-numeric)
    const phoneQuery = normalizedIdentifier.replace(/[^0-9]/g, '');
    if (phoneQuery && phoneQuery.length >= 10) {
      queryConditions.push({ phoneNumber: phoneQuery });
    } else {
      logger.warn('Doctor login attempt failed - Invalid identifier format', { identifier });
      throw new AppError('Please provide a valid email or phone number', 400);
    }
  }
  
  if (queryConditions.length === 0) {
    logger.warn('Doctor login attempt failed - Invalid identifier format', { identifier });
    throw new AppError('Please provide a valid email or phone number', 400);
  }
  
  // Find user with password field - MUST use .select('+password') because password has select: false
  const user = await User.findOne({
    $or: queryConditions,
    role: 'doctor' // Filter by role directly in query
  }).select('+password'); // IMPORTANT: Include password field
  
  if (!user) {
    // Check if user exists but is not a doctor
    const anyUser = await User.findOne({
      $or: queryConditions
    }).select('-password');
    
    if (anyUser) {
      logger.warn('Doctor login attempt failed - User exists but is not a doctor', { 
        identifier,
        userId: anyUser._id,
        role: anyUser.role,
        email: anyUser.email,
        phoneNumber: anyUser.phoneNumber
      });
      throw new AppError('Invalid credentials or not a doctor account', 401);
    }
    
    logger.warn('Doctor login attempt failed - User not found', { 
      identifier,
      queryConditions,
      isEmail,
      normalizedIdentifier
    });
    throw new AppError('Invalid credentials', 401);
  }
  
  logger.info('Doctor user found', { 
    userId: user._id, 
    email: user.email, 
    phoneNumber: user.phoneNumber,
    role: user.role,
    hasPassword: !!user.password,
    passwordFieldType: typeof user.password,
    passwordLength: user.password ? user.password.length : 0,
    identifier 
  });

  // Validate password input
  if (!password || typeof password !== 'string') {
    logger.warn('Doctor login attempt failed - Invalid password provided', { 
      userId: user._id, 
      identifier 
    });
    throw new AppError('Password is required', 400);
  }

  // Check if user has a password set
  if (!user.password) {
    logger.warn('Doctor login attempt failed - No password set for user', { 
      userId: user._id, 
      identifier,
      email: user.email,
      phoneNumber: user.phoneNumber
    });
    throw new AppError('Password not set. Please use forgot password to set your password.', 401);
  }

  // Validate and trim password
  if (!password || typeof password !== 'string') {
    logger.warn('Doctor login attempt failed - Invalid password provided', { 
      userId: user._id, 
      identifier,
      passwordType: typeof password
    });
    throw new AppError('Password is required', 400);
  }
  
  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    logger.warn('Doctor login attempt failed - Empty password provided', { 
      userId: user._id, 
      identifier 
    });
    throw new AppError('Password is required', 400);
  }
  
  // Verify password field exists
  if (!user.password) {
    logger.warn('Doctor login attempt failed - No password set for user', { 
      userId: user._id, 
      identifier,
      email: user.email,
      phoneNumber: user.phoneNumber
    });
    throw new AppError('Password not set. Please use forgot password to set your password.', 401);
  }
  
  // Check if password looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
  if (!isBcryptHash) {
    logger.error('Doctor login attempt - Password is not a valid bcrypt hash', {
      userId: user._id,
      identifier,
      passwordPrefix: user.password.substring(0, 10)
    });
    throw new AppError('Password format error. Please reset your password.', 500);
  }
  
  logger.info('Attempting password comparison', {
    userId: user._id,
    identifier,
    email: user.email,
    phoneNumber: user.phoneNumber,
    providedPasswordLength: trimmedPassword.length,
    hashedPasswordLength: user.password.length,
    isBcryptHash: isBcryptHash
  });
  
  // Compare passwords using bcrypt
  let isMatch = false;
  try {
    isMatch = await bcrypt.compare(trimmedPassword, user.password);
    logger.info('Password comparison result', {
      userId: user._id,
      identifier,
      isMatch: isMatch
    });
  } catch (error) {
    logger.error('Password comparison error', {
      userId: user._id,
      identifier,
      error: error.message,
      stack: error.stack
    });
    throw new AppError('Error during password verification', 500);
  }
  
  if (!isMatch) {
    // Try to find doctor to provide more context
    const doctor = await Doctor.findOne({ user: user._id });
    logger.warn('Doctor login attempt failed - Invalid password', { 
      userId: user._id, 
      identifier,
      email: user.email,
      phoneNumber: user.phoneNumber,
      hasPassword: !!user.password,
      passwordLength: trimmedPassword.length,
      doctorExists: !!doctor,
      doctorStatus: doctor?.status,
      doctorId: doctor?._id
    });
    throw new AppError('Invalid credentials', 401);
  }
  
  logger.info('Doctor password verified successfully', { 
    userId: user._id, 
    identifier 
  });

  // Check if doctor profile exists
  const doctor = await Doctor.findOne({ user: user._id })
    .populate('user', 'firstName lastName email phoneNumber countryCode role isActive isVerified');

  if (!doctor) {
    logger.warn('Doctor login attempt failed - Doctor profile not found', { userId: user._id });
    throw new AppError('Doctor profile not found. Please contact an administrator.', 404);
  }

  // Activate user and update last login
  user.isActive = true;
  user.lastLoginAt = new Date();
  await user.save();

  // Remove password before returning
  user.password = undefined;

  logger.info('Doctor logged in successfully', {
    userId: user._id,
    doctorId: doctor._id,
    identifier,
    loginMethod: 'password'
  });

  return { user, doctor };
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

// Helper to check if identifier is email
const isEmail = (identifier) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
};

// Forgot password - send OTP (accepts email or phone)
exports.forgotPassword = async (identifier, countryCode) => {
  const otpService = require('./otp.service');
  
  // Use sendPasswordResetOtp which sends password reset specific OTP
  const otpCode = await otpService.sendPasswordResetOtp(identifier, countryCode);
  
  const isEmailIdentifier = isEmail(identifier);
  const message = isEmailIdentifier 
    ? 'OTP sent to your email address' 
    : 'OTP sent to your phone number';
  
  return { message, otp: otpCode };
};

// Reset password with OTP (accepts email or phone)
exports.resetPassword = async (identifier, otp, newPassword) => {
  const otpService = require('./otp.service');
  const user = await otpService.verifyOtp(identifier, otp);
  
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

// Google OAuth Login
exports.loginWithGoogle = async (googleToken) => {
  const { OAuth2Client } = require('google-auth-library');
  
  // Initialize Google OAuth client
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: profilePicture } = payload;
    
    if (!email) {
      throw new AppError('Email not provided by Google', 400);
    }
    
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    
    if (user) {
      // User exists with Google ID - update and login
      user.email = email.toLowerCase();
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.isActive = true;
      user.isVerified = true;
      user.lastLoginAt = new Date();
      user.authProvider = 'google';
      await user.save();
      
      logger.info('Google login successful - existing user', {
        userId: user._id,
        email: user.email,
        googleId
      });
      
      // Remove password before returning
      user.password = undefined;
      return user;
    }
    
    // Check if user exists with this email (but different auth provider)
    user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // User exists with email but not Google - link Google account
      if (user.googleId) {
        throw new AppError('This email is already associated with another Google account', 409);
      }
      
      user.googleId = googleId;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.isActive = true;
      user.isVerified = true;
      user.lastLoginAt = new Date();
      user.authProvider = 'google';
      await user.save();
      
      logger.info('Google login successful - linked account', {
        userId: user._id,
        email: user.email,
        googleId
      });
      
      // Remove password before returning
      user.password = undefined;
      return user;
    }
    
    // New user - create account with Google
    // Generate a random password (won't be used but required by schema)
    const randomPassword = Math.random().toString(36).slice(-12) + Date.now().toString(36);
    
    user = await User.create({
      firstName: firstName || 'User',
      lastName: lastName || '',
      email: email.toLowerCase(),
      phoneNumber: `google_${googleId}`, // Placeholder phone number
      countryCode: '+1', // Default country code
      password: randomPassword, // Required by schema but won't be used
      googleId,
      authProvider: 'google',
      isVerified: true,
      isActive: true,
      agreeConfirmation: true, // Auto-agree for Google sign-in
      lastLoginAt: new Date()
    });
    
    logger.info('Google login successful - new user created', {
      userId: user._id,
      email: user.email,
      googleId
    });
    
    // Remove password before returning
    user.password = undefined;
    return user;
    
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    
    logger.error('Google login failed', {
      error: err.message,
      stack: err.stack
    });
    
    throw new AppError('Invalid Google token or authentication failed', 401);
  }
};

// Facebook OAuth Login
exports.loginWithFacebook = async (facebookToken) => {
  try {
    // Verify Facebook access token using Graph API
    const axios = require('axios');
    const response = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        access_token: facebookToken,
        fields: 'id,name,email,first_name,last_name,picture'
      }
    });

    const { id: facebookId, email, name, first_name: firstName, last_name: lastName, picture } = response.data;

    if (!email) {
      throw new AppError('Email not provided by Facebook', 400);
    }

    // Check if user exists with this Facebook ID
    let user = await User.findOne({ facebookId });

    if (user) {
      // User exists with Facebook ID - update and login
      user.email = email.toLowerCase();
      user.firstName = firstName || user.firstName || name?.split(' ')[0] || 'User';
      user.lastName = lastName || user.lastName || name?.split(' ').slice(1).join(' ') || '';
      user.isActive = true;
      user.isVerified = true;
      user.lastLoginAt = new Date();
      user.authProvider = 'facebook';
      await user.save();

      logger.info('Facebook login successful - existing user', {
        userId: user._id,
        email: user.email,
        facebookId
      });

      // Remove password before returning
      user.password = undefined;
      return user;
    }

    // Check if user exists with this email (but different auth provider)
    user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists with email but not Facebook - link Facebook account
      if (user.facebookId) {
        throw new AppError('This email is already associated with another Facebook account', 409);
      }

      user.facebookId = facebookId;
      user.firstName = firstName || user.firstName || name?.split(' ')[0] || 'User';
      user.lastName = lastName || user.lastName || name?.split(' ').slice(1).join(' ') || '';
      user.isActive = true;
      user.isVerified = true;
      user.lastLoginAt = new Date();
      user.authProvider = 'facebook';
      await user.save();

      logger.info('Facebook login successful - linked account', {
        userId: user._id,
        email: user.email,
        facebookId
      });

      // Remove password before returning
      user.password = undefined;
      return user;
    }

    // New user - create account with Facebook
    // Generate a random password (won't be used but required by schema)
    const randomPassword = Math.random().toString(36).slice(-12) + Date.now().toString(36);

    user = await User.create({
      firstName: firstName || name?.split(' ')[0] || 'User',
      lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
      email: email.toLowerCase(),
      phoneNumber: `facebook_${facebookId}`, // Placeholder phone number
      countryCode: '+1', // Default country code
      password: randomPassword, // Required by schema but won't be used
      facebookId,
      authProvider: 'facebook',
      isVerified: true,
      isActive: true,
      agreeConfirmation: true, // Auto-agree for Facebook sign-in
      lastLoginAt: new Date()
    });

    logger.info('Facebook login successful - new user created', {
      userId: user._id,
      email: user.email,
      facebookId
    });

    // Remove password before returning
    user.password = undefined;
    return user;

  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    // Handle Facebook API errors
    if (err.response && err.response.data) {
      logger.error('Facebook API error', {
        error: err.response.data,
        status: err.response.status
      });
      throw new AppError('Invalid Facebook token or authentication failed', 401);
    }

    logger.error('Facebook login failed', {
      error: err.message,
      stack: err.stack
    });

    throw new AppError('Invalid Facebook token or authentication failed', 401);
  }
};