const paymentService = require('../services/paymentService');
const { success } = require('../utils/response');

async function createLink(req, res, next) {
  try {
    const data = await paymentService.createPaymentLink(req.params.id);
    return success(res, 200, 'Payment link created', data);
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const data = await paymentService.handleWebhook(req.body, rawBody, signature);
    return success(res, 200, 'Webhook processed', data);
  } catch (err) {
    next(err);
  }
}

module.exports = { createLink, webhook };
