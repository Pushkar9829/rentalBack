require('dotenv').config();

function parseList(value, fallback = []) {
  if (!value || !String(value).trim()) return fallback;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const env = {
  port: parseInt(process.env.PORT, 10) || 5100,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rent_management',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  clientOrigins: parseList(process.env.CLIENT_URL, ['http://localhost:5173']),
  timezone: process.env.TZ || 'Asia/Kolkata',
  whatsapp: {
    mock: process.env.WHATSAPP_MOCK !== 'false',
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  seed: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@rentapp.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    name: process.env.SEED_ADMIN_NAME || 'System Admin',
  },
};

module.exports = env;
