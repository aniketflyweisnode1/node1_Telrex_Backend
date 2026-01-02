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

app.use(express.json());
app.use(cors());
app.use(helmet());

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

app.use('/api/v1', routes);
app.use(errorHandler);

module.exports = app;
