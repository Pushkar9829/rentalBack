const NotificationLog = require('../models/NotificationLog');

async function create(data) {
  return NotificationLog.create(data);
}

async function updateById(id, data) {
  return NotificationLog.findByIdAndUpdate(id, data, { new: true });
}

async function findAll(filter = {}, options = {}) {
  const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
  const [items, total] = await Promise.all([
    NotificationLog.find(filter)
      .populate('tenantId', 'name mobile whatsappNumber')
      .populate('rentRecordId', 'rentMonth amount status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    NotificationLog.countDocuments(filter),
  ]);
  return { items, total };
}

module.exports = { create, updateById, findAll };
