const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const rentRepository = require('../repositories/rentRepository');
const whatsappService = require('./whatsappService');

function getClient() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) return null;
  return new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });
}

async function createPaymentLink(rentRecordId) {
  const record = await rentRepository.findById(rentRecordId);
  if (!record) throw new ApiError(404, 'Rent record not found');
  if (record.status === 'paid') throw new ApiError(400, 'Rent already paid');

  const client = getClient();
  if (!client) {
    throw new ApiError(400, 'Razorpay is not configured. Use manual mark paid or set RAZORPAY keys.');
  }

  const tenant = record.tenantId;
  const link = await client.paymentLink.create({
    amount: Math.round(record.amount * 100),
    currency: 'INR',
    accept_partial: false,
    description: `Rent ${record.rentMonth} - ${tenant.name}`,
    customer: {
      name: tenant.name,
      contact: tenant.mobile,
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
    notes: {
      rentRecordId: String(record._id),
      tenantId: String(tenant._id),
      rentMonth: record.rentMonth,
    },
    callback_url: `${env.clientUrl}/payments/callback`,
    callback_method: 'get',
  });

  const updated = await rentRepository.updateById(record._id, {
    paymentLinkId: link.id,
    paymentLinkUrl: link.short_url,
    paymentMethod: 'razorpay',
  });

  return updated;
}

async function markPaid(rentRecordId, { paymentReference, paymentMethod, sendConfirmation = true }) {
  const record = await rentRepository.findById(rentRecordId);
  if (!record) throw new ApiError(404, 'Rent record not found');

  const updated = await rentRepository.updateById(rentRecordId, {
    status: 'paid',
    paymentDate: new Date(),
    paymentReference: paymentReference || `MANUAL-${Date.now()}`,
    paymentMethod: paymentMethod || 'manual',
  });

  if (sendConfirmation && updated.tenantId) {
    await whatsappService.sendPaymentConfirmation({
      tenant: updated.tenantId,
      rentRecord: updated,
    });
  }

  return updated;
}

async function markPending(rentRecordId) {
  const record = await rentRepository.findById(rentRecordId);
  if (!record) throw new ApiError(404, 'Rent record not found');
  return rentRepository.updateById(rentRecordId, {
    status: 'pending',
    paymentDate: null,
    paymentReference: '',
    paymentMethod: '',
  });
}

function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret) return true;
  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

async function handleWebhook(event, rawBody, signature) {
  if (env.razorpay.webhookSecret && !verifyWebhookSignature(rawBody, signature)) {
    throw new ApiError(401, 'Invalid webhook signature');
  }

  const eventType = event.event;
  if (eventType !== 'payment_link.paid' && eventType !== 'payment.captured') {
    return { ignored: true };
  }

  let rentRecordId =
    event.payload?.payment_link?.entity?.notes?.rentRecordId ||
    event.payload?.payment?.entity?.notes?.rentRecordId;

  if (!rentRecordId && event.payload?.payment_link?.entity?.id) {
    const byLink = await rentRepository.findOne({
      paymentLinkId: event.payload.payment_link.entity.id,
    });
    if (byLink) rentRecordId = String(byLink._id);
  }

  if (!rentRecordId) return { ignored: true, reason: 'No rentRecordId' };

  const paymentId =
    event.payload?.payment?.entity?.id ||
    event.payload?.payment_link?.entity?.id ||
    `RZ-${Date.now()}`;

  const updated = await markPaid(rentRecordId, {
    paymentReference: paymentId,
    paymentMethod: 'razorpay',
    sendConfirmation: true,
  });

  return { success: true, rentRecord: updated };
}

module.exports = {
  createPaymentLink,
  markPaid,
  markPending,
  handleWebhook,
  getClient,
};
