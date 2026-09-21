const rentService = require('../services/rentService');
const rentRepository = require('../repositories/rentRepository');
const settingsRepository = require('../repositories/settingsRepository');
const whatsappService = require('../services/whatsappService');
const { formatRentMonth, dayOfMonth } = require('../utils/dates');

async function runMonthlyGeneration(options = {}) {
  const rentMonth = options.rentMonth || formatRentMonth();
  console.log(`[job] Generating rents for ${rentMonth}`);
  const result = await rentService.generateMonthlyRents(rentMonth, {
    sendNotifications: options.sendNotifications !== false,
    createPaymentLinks: !!options.createPaymentLinks,
  });
  console.log(
    `[job] Created ${result.created.length}, skipped ${result.skipped.length}`
  );
  return result;
}

async function runReminders(options = {}) {
  const settings = await settingsRepository.getSettings();
  const reminderDays = settings.reminderDays || [1, 3, 5, 7];
  const today = options.forceDay || dayOfMonth();

  if (!reminderDays.includes(today) && !options.force) {
    console.log(`[job] Day ${today} not in reminder schedule ${reminderDays}`);
    return { skipped: true, day: today };
  }

  // Day 1 is handled by monthly generation as initial request
  if (today === 1 && !options.force) {
    console.log('[job] Day 1 reminders skipped (handled by monthly job)');
    return { skipped: true, reason: 'day1' };
  }

  const unpaid = await rentRepository.findUnpaidForReminders();
  const results = [];

  for (const record of unpaid) {
    if (!record.tenantId || record.tenantId.status !== 'active') continue;
    // Avoid double-sending same day
    if (
      record.lastReminderAt &&
      new Date(record.lastReminderAt).toDateString() === new Date().toDateString() &&
      !options.force
    ) {
      continue;
    }

    const notification = await whatsappService.sendReminder({
      tenant: record.tenantId,
      rentRecord: record,
    });
    await rentRepository.updateById(record._id, {
      reminderCount: (record.reminderCount || 0) + 1,
      lastReminderAt: new Date(),
      reminderStatus: 'reminded',
    });
    results.push({ rentRecordId: record._id, notification });
  }

  console.log(`[job] Sent ${results.length} reminders`);
  return { sent: results.length, results };
}

async function runOverdueMarking() {
  const result = await rentRepository.markOverdue(new Date());
  console.log(`[job] Marked overdue: ${result.modifiedCount || 0}`);
  return result;
}

module.exports = {
  runMonthlyGeneration,
  runReminders,
  runOverdueMarking,
};
