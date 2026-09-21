const Admin = require('../models/Admin');

async function findByEmail(email) {
  return Admin.findOne({ email: email.toLowerCase() });
}

async function findById(id) {
  return Admin.findById(id).select('-passwordHash');
}

async function create(data) {
  return Admin.create(data);
}

module.exports = { findByEmail, findById, create };
