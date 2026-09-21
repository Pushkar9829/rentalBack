const env = require('../config/env');
const notificationRepository = require('../repositories/notificationRepository');
const settingsRepository = require('../repositories/settingsRepository');
const { monthLabel } = require('../utils/dates');

async function sendWhatsAppMessage({
  tenantId,
  rentRecordId,
  to,
  type,
  bodyText,
  templateName,
  components = [],
}) {
  const log = await notificationRepository.create({
    tenantId,
    rentRecordId: rentRecordId || null,
    type,
    channel: 'whatsapp',
    status: 'pending',
    toNumber: to,
    payload: { bodyText, templateName, components },
  });

  const useMock =
    env.whatsapp.mock || !env.whatsapp.token || !env.whatsapp.phoneNumberId;

  try {
    if (useMock) {
      const mockId = `mock_${Date.now()}`;
      await notificationRepository.updateById(log._id, {
        status: 'sent',
        providerMessageId: mockId,
        response: { mock: true, bodyText },
      });
      return { success: true, mock: true, messageId: mockId, logId: log._id };
    }

    const url = `https://graph.facebook.com/${env.whatsapp.apiVersion}/${env.whatsapp.phoneNumberId}/messages`;
    const payload = templateName
      ? {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components,
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: { body: bodyText },
        };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      await notificationRepository.updateById(log._id, {
        status: 'failed',
        error: data.error?.message || 'WhatsApp API error',
        response: data,
      });
      return { success: false, error: data.error?.message, logId: log._id };
    }

    const messageId = data.messages?.[0]?.id || '';
    await notificationRepository.updateById(log._id, {
      status: 'sent',
      providerMessageId: messageId,
      response: data,
    });
    return { success: true, messageId, logId: log._id };
  } catch (err) {
    await notificationRepository.updateById(log._id, {
      status: 'failed',
      error: err.message,
    });
    return { success: false, error: err.message, logId: log._id };
  }
}

async function sendRentRequest({ tenant, rentRecord, paymentLinkUrl }) {
  const settings = await settingsRepository.getSettings();
  const month = monthLabel(rentRecord.rentMonth);
  const amount = rentRecord.amount;
  const unit = tenant.unitNumber || 'N/A';
  const link = paymentLinkUrl || rentRecord.paymentLinkUrl || '';
  const instructions = settings.paymentInstructions || '';
  const support = settings.supportContact || '';

  const bodyText = `Hello ${tenant.name}, your rent of ₹${amount} for ${month} (Unit: ${unit}) is now due on ${new Date(
    rentRecord.dueDate
  ).toLocaleDateString('en-IN')}. ${link ? `Pay here: ${link}. ` : ''}${instructions}${
    support ? ` Contact: ${support}` : ''
  }`;

  return sendWhatsAppMessage({
    tenantId: tenant._id,
    rentRecordId: rentRecord._id,
    to: tenant.whatsappNumber,
    type: 'rent_request',
    bodyText,
    templateName: settings.whatsappTemplates?.rentRequest,
    components: [],
  });
}

async function sendReminder({ tenant, rentRecord }) {
  const settings = await settingsRepository.getSettings();
  const month = monthLabel(rentRecord.rentMonth);
  const bodyText = `Reminder: Hello ${tenant.name}, your rent of ₹${rentRecord.amount} for ${month} is still pending. Please complete payment soon.${
    rentRecord.paymentLinkUrl ? ` Link: ${rentRecord.paymentLinkUrl}` : ''
  }`;

  return sendWhatsAppMessage({
    tenantId: tenant._id,
    rentRecordId: rentRecord._id,
    to: tenant.whatsappNumber,
    type: 'reminder',
    bodyText,
    templateName: settings.whatsappTemplates?.reminder,
  });
}

async function sendPaymentConfirmation({ tenant, rentRecord }) {
  const settings = await settingsRepository.getSettings();
  const month = monthLabel(rentRecord.rentMonth);
  const bodyText = `Payment received. Thank you ${tenant.name}. Rent of ₹${rentRecord.amount} for ${month} is marked as Paid. Ref: ${
    rentRecord.paymentReference || 'N/A'
  }`;

  return sendWhatsAppMessage({
    tenantId: tenant._id,
    rentRecordId: rentRecord._id,
    to: tenant.whatsappNumber,
    type: 'payment_confirmation',
    bodyText,
    templateName: settings.whatsappTemplates?.paymentConfirmation,
  });
}

module.exports = {
  sendRentRequest,
  sendReminder,
  sendPaymentConfirmation,
};
