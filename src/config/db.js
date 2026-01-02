const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true
    });

    logger.info('MongoDB connected successfully', {
      database: process.env.MONGODB_URI?.split('/').pop() || 'unknown'
    });
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

module.exports = connectDB;
