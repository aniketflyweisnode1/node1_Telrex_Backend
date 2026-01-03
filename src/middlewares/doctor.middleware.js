const AppError = require('../utils/AppError');

// Middleware to check if user is a doctor
exports.isDoctor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized - Please login first' 
    });
  }

  if (req.user.role !== 'doctor') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden - Doctor access required' 
    });
  }

  next();
};

