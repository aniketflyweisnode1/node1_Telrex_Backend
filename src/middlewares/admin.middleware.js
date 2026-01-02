const AppError = require('../utils/AppError');

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized - Please login first' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden - Admin access required' 
    });
  }

  next();
};

// Middleware to check if user is admin or sub-admin
exports.isAdminOrSubAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized - Please login first' 
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden - Admin or Sub-Admin access required' 
    });
  }

  next();
};

