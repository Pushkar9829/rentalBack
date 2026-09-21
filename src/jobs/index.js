const cron = require('node-cron');
const env = require('../config/env');
const {
  runMonthlyGeneration,
  runReminders,
  runOverdueMarking,
} = require('./rentJobs');

function startCronJobs() {
  // 1st of every month at 00:05
  cron.schedule(
    '5 0 1 * *',
    async () => {
      try {
        await runMonthlyGeneration();
      } catch (err) {
        console.error('[cron] monthly generation failed', err);
      }
    },
    { timezone: env.timezone }
  );

  // Daily at 09:00 — reminders + overdue
  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        await runOverdueMarking();
        await runReminders();
      } catch (err) {
        console.error('[cron] daily reminder failed', err);
      }
    },
    { timezone: env.timezone }
  );

  console.log(`Cron jobs scheduled (timezone: ${env.timezone})`);
}

module.exports = { startCronJobs };
