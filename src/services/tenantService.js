const ApiError = require('../utils/ApiError');
const tenantRepository = require('../repositories/tenantRepository');
const propertyRepository = require('../repositories/propertyRepository');
const Tenant = require('../models/Tenant');
const { DEFAULT_TENANT_PASSWORD } = require('./tenantPortalService');

async function syncPropertyAssignment(tenant) {
  if (!tenant.propertyId) return;
  await propertyRepository.updateById(tenant.propertyId, {
    assignedTenantId: tenant.status === 'active' ? tenant._id : null,
    occupancyStatus: tenant.status === 'active' ? 'occupied' : 'vacant',
    rentalStatus: tenant.status === 'active' ? 'rented' : 'available',
    tenantStartDate: tenant.tenancyStartDate || null,
    monthlyRent: tenant.monthlyRent,
    unitNumber: tenant.unitNumber || undefined,
  });
}

async function createTenant(payload) {
  if (payload.propertyId) {
    const property = await propertyRepository.findById(payload.propertyId);
    if (!property) throw new ApiError(400, 'Invalid propertyId');
    if (!payload.propertyAddress) payload.propertyAddress = property.address;
    if (!payload.unitNumber && property.unitNumber) payload.unitNumber = property.unitNumber;
  }

  const plainPassword = payload.password || DEFAULT_TENANT_PASSWORD;
  delete payload.password;
  payload.passwordHash = await Tenant.hashPassword(plainPassword);

  const tenant = await tenantRepository.create(payload);
  await syncPropertyAssignment(tenant);
  return tenantRepository.findById(tenant._id);
}

async function listTenants(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.propertyId) filter.propertyId = query.propertyId;
  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, 'i') },
      { mobile: new RegExp(query.search, 'i') },
      { unitNumber: new RegExp(query.search, 'i') },
      { whatsappNumber: new RegExp(query.search, 'i') },
    ];
  }
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
  const result = await tenantRepository.findAll(filter, {
    skip: (page - 1) * limit,
    limit,
  });
  return { ...result, page, limit };
}

async function getTenant(id) {
  const tenant = await tenantRepository.findById(id);
  if (!tenant) throw new ApiError(404, 'Tenant not found');
  return tenant;
}

async function updateTenant(id, payload) {
  const existing = await tenantRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Tenant not found');

  if (payload.propertyId) {
    const property = await propertyRepository.findById(payload.propertyId);
    if (!property) throw new ApiError(400, 'Invalid propertyId');
  }

  if (
    existing.propertyId &&
    payload.propertyId &&
    String(existing.propertyId._id || existing.propertyId) !== String(payload.propertyId)
  ) {
    await propertyRepository.updateById(existing.propertyId._id || existing.propertyId, {
      assignedTenantId: null,
      occupancyStatus: 'vacant',
      rentalStatus: 'available',
    });
  }

  const tenant = await tenantRepository.updateById(id, payload);
  await syncPropertyAssignment(tenant);
  return tenant;
}

async function deactivateTenant(id) {
  return updateTenant(id, { status: 'inactive' });
}

async function deleteTenant(id) {
  const tenant = await tenantRepository.findById(id);
  if (!tenant) throw new ApiError(404, 'Tenant not found');
  if (tenant.propertyId) {
    await propertyRepository.updateById(tenant.propertyId._id || tenant.propertyId, {
      assignedTenantId: null,
      occupancyStatus: 'vacant',
      rentalStatus: 'available',
    });
  }
  await tenantRepository.deleteById(id);
  return tenant;
}

module.exports = {
  createTenant,
  listTenants,
  getTenant,
  updateTenant,
  deactivateTenant,
  deleteTenant,
};
