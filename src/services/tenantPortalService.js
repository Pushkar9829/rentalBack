const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const Tenant = require('../models/Tenant');
const rentRepository = require('../repositories/rentRepository');
const { formatRentMonth } = require('../utils/dates');

const DEFAULT_TENANT_PASSWORD = process.env.SEED_TENANT_PASSWORD || 'Tenant@123';

async function login(mobile, password) {
  const normalized = String(mobile || '').replace(/\D/g, '');
  const tenant = await Tenant.findOne({
    $or: [
      { mobile: mobile },
      { mobile: normalized },
      { whatsappNumber: mobile },
      { whatsappNumber: normalized },
      { whatsappNumber: `91${normalized}` },
    ],
  });

  if (!tenant || tenant.status === 'vacated') {
    throw new ApiError(401, 'Invalid mobile or password');
  }

  // Auto-set password for legacy tenants without one
  if (!tenant.passwordHash) {
    tenant.passwordHash = await Tenant.hashPassword(DEFAULT_TENANT_PASSWORD);
    await tenant.save();
  }

  const match = await tenant.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid mobile or password');

  const token = jwt.sign({ id: tenant._id, role: 'tenant' }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    tenant: {
      id: tenant._id,
      name: tenant.name,
      mobile: tenant.mobile,
      email: tenant.email,
      unitNumber: tenant.unitNumber,
      monthlyRent: tenant.monthlyRent,
      status: tenant.status,
    },
  };
}

async function getProfile(tenantId) {
  const tenant = await Tenant.findById(tenantId)
    .select('-passwordHash')
    .populate('propertyId', 'name address unitNumber');
  if (!tenant) throw new ApiError(404, 'Tenant not found');
  return tenant;
}

async function getPortalSummary(tenantId) {
  const tenant = await getProfile(tenantId);
  const rentMonth = formatRentMonth();
  const current = await rentRepository.findOne({ tenantId, rentMonth });
  const { items: history, total } = await rentRepository.findAll(
    { tenantId },
    { limit: 24, sort: { rentMonth: -1 } }
  );

  return {
    tenant,
    rentMonth,
    currentRent: current,
    history,
    historyTotal: total,
  };
}

async function ensureTenantPassword(tenantDoc, plainPassword = DEFAULT_TENANT_PASSWORD) {
  if (!tenantDoc.passwordHash) {
    tenantDoc.passwordHash = await Tenant.hashPassword(plainPassword);
    await tenantDoc.save();
  }
  return tenantDoc;
}

module.exports = {
  login,
  getProfile,
  getPortalSummary,
  ensureTenantPassword,
  DEFAULT_TENANT_PASSWORD,
};
