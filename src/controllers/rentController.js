const rentService = require('../services/rentService');
const paymentService = require('../services/paymentService');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const data = await rentService.listRents(req.query);
    return success(res, 200, 'Rent records', data);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const data = await rentService.getRent(req.params.id);
    return success(res, 200, 'Rent record', data);
  } catch (err) {
    next(err);
  }
}

async function generate(req, res, next) {
  try {
    const data = await rentService.generateMonthlyRents(req.body.rentMonth, {
      sendNotifications: req.body.sendNotifications !== false,
      createPaymentLinks: !!req.body.createPaymentLinks,
    });
    return success(res, 200, 'Monthly rents generated', data);
  } catch (err) {
    next(err);
  }
}

async function markPaid(req, res, next) {
  try {
    const data = await paymentService.markPaid(req.params.id, {
      paymentReference: req.body.paymentReference,
      paymentMethod: req.body.paymentMethod || 'manual',
      sendConfirmation: req.body.sendConfirmation !== false,
    });
    return success(res, 200, 'Marked as paid', data);
  } catch (err) {
    next(err);
  }
}

async function markPending(req, res, next) {
  try {
    const data = await paymentService.markPending(req.params.id);
    return success(res, 200, 'Marked as pending', data);
  } catch (err) {
    next(err);
  }
}

async function sendRequest(req, res, next) {
  try {
    const data = await rentService.sendPaymentRequest(req.params.id, {
      createLink: !!req.body.createLink,
    });
    return success(res, 200, 'Payment request sent', data);
  } catch (err) {
    next(err);
  }
}

async function sendReminder(req, res, next) {
  try {
    const data = await rentService.sendPaymentReminder(req.params.id);
    return success(res, 200, 'Reminder sent', data);
  } catch (err) {
    next(err);
  }
}

async function updateAmount(req, res, next) {
  try {
    const data = await rentService.updateRentAmount(req.params.id, req.body.amount);
    return success(res, 200, 'Amount updated', data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  generate,
  markPaid,
  markPending,
  sendRequest,
  sendReminder,
  updateAmount,
};
