const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, __dirname);
dotenv.config({ path: root('.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  MONGO_URL: process.env.MONGO_URL,
  PROXY_SERVER: process.env.PROXY_SERVER,
  PROXY_PORT: process.env.PROXY_PORT,
  PROXY_LOGIN: process.env.PROXY_LOGIN,
  PROXY_PASSWORD: process.env.PROXY_PASSWORD
};