const RentRecord = require('../models/RentRecord');

async function create(data) {
  return RentRecord.create(data);
}

async function findById(id) {
  return RentRecord.findById(id)
    .populate('tenantId', 'name mobile whatsappNumber unitNumber monthlyRent status')
    .populate('propertyId', 'name address unitNumber');
}

async function findOne(filter) {
  return RentRecord.findOne(filter);
}

async function findAll(filter = {}, options = {}) {
  const { skip = 0, limit = 100, sort = { rentMonth: -1, createdAt: -1 } } = options;
  const [items, total] = await Promise.all([
    RentRecord.find(filter)
      .populate('tenantId', 'name mobile whatsappNumber unitNumber monthlyRent status')
      .populate('propertyId', 'name address unitNumber')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    RentRecord.countDocuments(filter),
  ]);
  return { items, total };
}

async function updateById(id, data) {
  return RentRecord.findByIdAndUpdate(id, data, { new: true })
    .populate('tenantId', 'name mobile whatsappNumber unitNumber monthlyRent status')
    .populate('propertyId', 'name address unitNumber');
}

async function aggregateByMonth(rentMonth) {
  return RentRecord.aggregate([
    { $match: { rentMonth } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
  ]);
}

async function findUnpaidForReminders() {
  return RentRecord.find({
    status: { $in: ['pending', 'payment_requested', 'overdue'] },
  }).populate('tenantId');
}

async function markOverdue(beforeDate) {
  return RentRecord.updateMany(
    {
      status: { $in: ['pending', 'payment_requested'] },
      dueDate: { $lt: beforeDate },
    },
    { $set: { status: 'overdue' } }
  );
}

module.exports = {
  create,
  findById,
  findOne,
  findAll,
  updateById,
  aggregateByMonth,
  findUnpaidForReminders,
  markOverdue,
};
