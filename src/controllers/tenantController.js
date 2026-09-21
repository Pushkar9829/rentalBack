const tenantService = require('../services/tenantService');
const { success } = require('../utils/response');

async function create(req, res, next) {
  try {
    const data = await tenantService.createTenant(req.body);
    return success(res, 201, 'Tenant created', data);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const data = await tenantService.listTenants(req.query);
    return success(res, 200, 'Tenants', data);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await tenantService.getTenant(req.params.id);
    return success(res, 200, 'Tenant', data);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = await tenantService.updateTenant(req.params.id, req.body);
    return success(res, 200, 'Tenant updated', data);
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const data = await tenantService.deactivateTenant(req.params.id);
    return success(res, 200, 'Tenant deactivated', data);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await tenantService.deleteTenant(req.params.id);
    return success(res, 200, 'Tenant deleted', data);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, deactivate, remove };
