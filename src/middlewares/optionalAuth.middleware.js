const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User.model');

// Optional auth middleware - doesn't fail if no token, just sets req.user if token is valid
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If no token, just continue without setting req.user
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    
    // Optionally load full user data
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = {
        id: user._id,
        role: user.role,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (err) {
    // If token is invalid, just continue without setting req.user
    req.user = null;
    next();
  }
};

