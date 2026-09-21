const Tenant = require('../models/Tenant');

async function create(data) {
  return Tenant.create(data);
}

async function findById(id) {
  return Tenant.findById(id).populate('propertyId', 'name address unitNumber');
}

async function findAll(filter = {}, options = {}) {
  const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
  const query = Tenant.find(filter)
    .populate('propertyId', 'name address unitNumber')
    .sort(sort)
    .skip(skip)
    .limit(limit);
  const [items, total] = await Promise.all([query, Tenant.countDocuments(filter)]);
  return { items, total };
}

async function findActive() {
  return Tenant.find({ status: 'active' }).populate('propertyId', 'name address unitNumber');
}

async function updateById(id, data) {
  return Tenant.findByIdAndUpdate(id, data, { new: true }).populate(
    'propertyId',
    'name address unitNumber'
  );
}

async function deleteById(id) {
  return Tenant.findByIdAndDelete(id);
}

module.exports = {
  create,
  findById,
  findAll,
  findActive,
  updateById,
  deleteById,
};
