const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, __dirname);
dotenv.config({ path: root('.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  MONGO_URL: process.env.MONGO_URL || 'mongodb+srv://tt-bot:asser220@cluster0.9ydzh.mongodb.net/bot_db?retryWrites=true&w=majority'
};