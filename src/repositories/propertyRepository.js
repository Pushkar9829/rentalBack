const Property = require('../models/Property');

async function create(data) {
  return Property.create(data);
}

async function findById(id) {
  return Property.findById(id).populate('assignedTenantId', 'name mobile status');
}

async function findAll(filter = {}, options = {}) {
  const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
  const [items, total] = await Promise.all([
    Property.find(filter).populate('assignedTenantId', 'name mobile status').sort(sort).skip(skip).limit(limit),
    Property.countDocuments(filter),
  ]);
  return { items, total };
}

async function updateById(id, data) {
  return Property.findByIdAndUpdate(id, data, { new: true }).populate(
    'assignedTenantId',
    'name mobile status'
  );
}

async function deleteById(id) {
  return Property.findByIdAndDelete(id);
}

module.exports = { create, findById, findAll, updateById, deleteById };
