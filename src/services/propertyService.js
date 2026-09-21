const ApiError = require('../utils/ApiError');
const propertyRepository = require('../repositories/propertyRepository');

async function createProperty(payload) {
  return propertyRepository.create(payload);
}

async function listProperties(query) {
  const filter = {};
  if (query.occupancyStatus) filter.occupancyStatus = query.occupancyStatus;
  if (query.rentalStatus) filter.rentalStatus = query.rentalStatus;
  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, 'i') },
      { address: new RegExp(query.search, 'i') },
      { unitNumber: new RegExp(query.search, 'i') },
    ];
  }
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
  const result = await propertyRepository.findAll(filter, {
    skip: (page - 1) * limit,
    limit,
  });
  return { ...result, page, limit };
}

async function getProperty(id) {
  const property = await propertyRepository.findById(id);
  if (!property) throw new ApiError(404, 'Property not found');
  return property;
}

async function updateProperty(id, payload) {
  const property = await propertyRepository.updateById(id, payload);
  if (!property) throw new ApiError(404, 'Property not found');
  return property;
}

async function deleteProperty(id) {
  const property = await propertyRepository.deleteById(id);
  if (!property) throw new ApiError(404, 'Property not found');
  return property;
}

module.exports = {
  createProperty,
  listProperties,
  getProperty,
  updateProperty,
  deleteProperty,
};
