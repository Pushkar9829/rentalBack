const ApiError = require('../utils/ApiError');
const rentRepository = require('../repositories/rentRepository');
const tenantRepository = require('../repositories/tenantRepository');
const whatsappService = require('./whatsappService');
const paymentService = require('./paymentService');
const { formatRentMonth, getDueDate } = require('../utils/dates');

async function listRents(query) {
  const filter = {};
  if (query.rentMonth) filter.rentMonth = query.rentMonth;
  if (query.status) filter.status = query.status;
  if (query.tenantId) filter.tenantId = query.tenantId;
  if (query.propertyId) filter.propertyId = query.propertyId;
  if (query.paid === 'true') filter.status = 'paid';
  if (query.paid === 'false') filter.status = { $in: ['pending', 'payment_requested', 'overdue'] };
  if (query.overdue === 'true') filter.status = 'overdue';

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 100, 200);
  const result = await rentRepository.findAll(filter, {
    skip: (page - 1) * limit,
    limit,
  });
  return { ...result, page, limit };
}

async function getRent(id) {
  const record = await rentRepository.findById(id);
  if (!record) throw new ApiError(404, 'Rent record not found');
  return record;
}

async function generateMonthlyRents(rentMonth, { sendNotifications = true, createPaymentLinks = false } = {}) {
  const month = rentMonth || formatRentMonth();
  const tenants = await tenantRepository.findActive();
  const created = [];
  const skipped = [];
  const notifications = [];

  for (const tenant of tenants) {
    const existing = await rentRepository.findOne({ tenantId: tenant._id, rentMonth: month });
    if (existing) {
      skipped.push(existing);
      continue;
    }

    let record = await rentRepository.create({
      tenantId: tenant._id,
      propertyId: tenant.propertyId?._id || tenant.propertyId || null,
      rentMonth: month,
      amount: tenant.monthlyRent,
      dueDate: getDueDate(month, tenant.rentDueDay || 1),
      status: 'pending',
    });

    if (createPaymentLinks && paymentService.getClient()) {
      try {
        record = await paymentService.createPaymentLink(record._id);
      } catch (_) {
        // optional
      }
    }

    if (sendNotifications) {
      const result = await whatsappService.sendRentRequest({
        tenant,
        rentRecord: record,
      });
      notifications.push(result);
      record = await rentRepository.updateById(record._id, {
        status: 'payment_requested',
        reminderStatus: 'requested',
      });
    }

    created.push(record);
  }

  return { rentMonth: month, created, skipped, notifications };
}

async function sendPaymentRequest(rentRecordId, { createLink = false } = {}) {
  let record = await rentRepository.findById(rentRecordId);
  if (!record) throw new ApiError(404, 'Rent record not found');
  if (record.status === 'paid') throw new ApiError(400, 'Already paid');

  if (createLink && paymentService.getClient()) {
    record = await paymentService.createPaymentLink(rentRecordId);
  }

  const tenant = record.tenantId;
  const result = await whatsappService.sendRentRequest({ tenant, rentRecord: record });
  const updated = await rentRepository.updateById(rentRecordId, {
    status: record.status === 'overdue' ? 'overdue' : 'payment_requested',
    reminderStatus: 'requested',
  });
  return { rentRecord: updated, notification: result };
}

async function sendPaymentReminder(rentRecordId) {
  const record = await rentRepository.findById(rentRecordId);
  if (!record) throw new ApiError(404, 'Rent record not found');
  if (record.status === 'paid') throw new ApiError(400, 'Already paid');

  const result = await whatsappService.sendReminder({
    tenant: record.tenantId,
    rentRecord: record,
  });

  const updated = await rentRepository.updateById(rentRecordId, {
    reminderCount: (record.reminderCount || 0) + 1,
    lastReminderAt: new Date(),
    reminderStatus: 'reminded',
  });

  return { rentRecord: updated, notification: result };
}

async function updateRentAmount(id, amount) {
  if (amount < 0) throw new ApiError(400, 'Invalid amount');
  const record = await rentRepository.updateById(id, { amount });
  if (!record) throw new ApiError(404, 'Rent record not found');
  return record;
}

module.exports = {
  listRents,
  getRent,
  generateMonthlyRents,
  sendPaymentRequest,
  sendPaymentReminder,
  updateRentAmount,
};
