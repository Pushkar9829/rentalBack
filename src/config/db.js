const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// Helps mongodb+srv DNS resolution on some Windows networks
if (typeof env.mongoUri === 'string' && env.mongoUri.includes('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
  } catch (_) {
    /* ignore */
  }
}

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 20000,
  });
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}

module.exports = { connectDB };
