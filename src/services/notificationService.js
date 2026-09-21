const notificationRepository = require('../repositories/notificationRepository');

async function listNotifications(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.tenantId) filter.tenantId = query.tenantId;
  if (query.rentRecordId) filter.rentRecordId = query.rentRecordId;

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
  const result = await notificationRepository.findAll(filter, {
    skip: (page - 1) * limit,
    limit,
  });
  return { ...result, page, limit };
}

module.exports = { listNotifications };
