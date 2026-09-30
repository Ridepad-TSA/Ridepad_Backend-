const dotenv = require('dotenv');

dotenv.config();

function requiredEnvironmentVariable(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car-rental',
  jwtSecret: requiredEnvironmentVariable('JWT_SECRET'),
  adminEmail: requiredEnvironmentVariable('ADMIN_EMAIL'),
  adminPassword: requiredEnvironmentVariable('ADMIN_PASSWORD'),
}
