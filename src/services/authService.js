const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const adminRepository = require('../repositories/adminRepository');
const Admin = require('../models/Admin');

async function login(email, password) {
  const admin = await adminRepository.findByEmail(email);
  if (!admin || !admin.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const match = await admin.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  const token = jwt.sign({ id: admin._id, role: admin.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
}

async function getProfile(adminId) {
  const admin = await adminRepository.findById(adminId);
  if (!admin) throw new ApiError(404, 'Admin not found');
  return admin;
}

async function ensureSeedAdmin() {
  const existing = await adminRepository.findByEmail(env.seed.email);
  if (existing) return existing;
  const passwordHash = await Admin.hashPassword(env.seed.password);
  return adminRepository.create({
    name: env.seed.name,
    email: env.seed.email,
    passwordHash,
    role: 'admin',
  });
}

module.exports = { login, getProfile, ensureSeedAdmin };
