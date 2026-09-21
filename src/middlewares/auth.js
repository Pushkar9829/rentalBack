const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const adminRepository = require('../repositories/adminRepository');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = jwt.verify(token, env.jwtSecret);
    const admin = await adminRepository.findById(decoded.id);
    if (!admin || !admin.isActive) throw new ApiError(401, 'Invalid or inactive admin');

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    next(err);
  }
}

module.exports = { authenticate };
