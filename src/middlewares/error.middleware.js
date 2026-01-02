/* eslint-disable no-unused-vars */
const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log error with context
  logger.error('Request Error', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous',
    body: req.body,
    query: req.query,
    params: req.params
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // =========================
  // Mongoose: Invalid ObjectId
  // =========================
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // =========================
  // Mongoose: Duplicate Key
  // =========================
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // =========================
  // Mongoose: Validation Error
  // =========================
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
  }

  // =========================
  // JWT Errors
  // =========================
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;
