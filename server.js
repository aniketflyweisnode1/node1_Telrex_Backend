require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise
  });
  process.exit(1);
});
