const propertyService = require('../services/propertyService');
const { success } = require('../utils/response');

async function create(req, res, next) {
  try {
    const data = await propertyService.createProperty(req.body);
    return success(res, 201, 'Property created', data);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const data = await propertyService.listProperties(req.query);
    return success(res, 200, 'Properties', data);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await propertyService.getProperty(req.params.id);
    return success(res, 200, 'Property', data);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = await propertyService.updateProperty(req.params.id, req.body);
    return success(res, 200, 'Property updated', data);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await propertyService.deleteProperty(req.params.id);
    return success(res, 200, 'Property deleted', data);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, remove };
