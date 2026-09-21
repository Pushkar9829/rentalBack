const {
  runMonthlyGeneration,
  runReminders,
  runOverdueMarking,
} = require('../jobs/rentJobs');
const { success } = require('../utils/response');

async function runMonthly(req, res, next) {
  try {
    const data = await runMonthlyGeneration({
      rentMonth: req.body.rentMonth,
      sendNotifications: req.body.sendNotifications !== false,
      createPaymentLinks: !!req.body.createPaymentLinks,
    });
    return success(res, 200, 'Monthly job completed', data);
  } catch (err) {
    next(err);
  }
}

async function runReminderJob(req, res, next) {
  try {
    const data = await runReminders({
      force: !!req.body.force,
      forceDay: req.body.forceDay,
    });
    return success(res, 200, 'Reminder job completed', data);
  } catch (err) {
    next(err);
  }
}

async function runOverdue(req, res, next) {
  try {
    const data = await runOverdueMarking();
    return success(res, 200, 'Overdue job completed', data);
  } catch (err) {
    next(err);
  }
}

module.exports = { runMonthly, runReminderJob, runOverdue };
