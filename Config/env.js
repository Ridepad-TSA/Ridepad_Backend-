const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-rental',
  jwtSecret: process.env.JWT_SECRET || '3423124434009890054',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@carrental.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Access231@#?',
};
