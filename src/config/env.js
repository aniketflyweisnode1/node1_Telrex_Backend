const path = require('path');
require('dotenv').config({
  path: path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});
