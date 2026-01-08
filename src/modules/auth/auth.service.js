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