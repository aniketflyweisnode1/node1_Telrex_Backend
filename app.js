const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const logger = require('./src/utils/logger');

const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/error.middleware');

const app = express();

// Trust proxy for accurate IP detection (important for login tracking)
app.set('trust proxy', true);
//hi
app.use(express.json());
app.use(cors());

// Configure Helmet with relaxed CSP for test pages
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts for test page
        "https://accounts.google.com",
        "https://*.googleapis.com",
        "https://*.gstatic.com",
        "https://connect.facebook.net",
        "https://*.facebook.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.googleusercontent.com"],
      connectSrc: [
        "'self'", 
        "https://accounts.google.com", 
        "https://*.googleapis.com",
        "https://*.gstatic.com",
        "https://graph.facebook.com",
        "https://*.facebook.com"
      ],
      frameSrc: [
        "'self'", 
        "https://accounts.google.com",
        "https://*.googleapis.com",
        "https://*.facebook.com"
      ],
      frameAncestors: ["'self'", "https://accounts.google.com"]
    }
  }
}));

// Morgan HTTP request logger - integrated with Winston
const morganFormat = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : 'dev';

const morganStream = {
  write: (message) => {
    logger.info(message.trim(), { type: 'http' });
  }
};

app.use(morgan(morganFormat, { stream: morganStream }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Serve test HTML files (for Google OAuth testing)
app.use(express.static(__dirname, { 
  extensions: ['html'],
  index: false 
}));

// Serve test-google-login.html at root path
app.get('/test-google-login', (req, res) => {
  res.sendFile(__dirname + '/test-google-login.html');
});

app.use('/api/v1', routes);
app.use(errorHandler);

module.exports = app;
