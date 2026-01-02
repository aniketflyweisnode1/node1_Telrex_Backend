const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User.model');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    
    // Optionally load full user data
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' 
    });
  }
};
