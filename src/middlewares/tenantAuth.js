const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const Tenant = require('../models/Tenant');

async function authenticateTenant(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.role !== 'tenant') throw new ApiError(401, 'Tenant access required');

    const tenant = await Tenant.findById(decoded.id)
      .select('-passwordHash')
      .populate('propertyId', 'name address unitNumber');
    if (!tenant || tenant.status === 'vacated') {
      throw new ApiError(401, 'Invalid or inactive tenant');
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    next(err);
  }
}

module.exports = { authenticateTenant };
