const settingsRepository = require('../repositories/settingsRepository');

async function getSettings() {
  return settingsRepository.getSettings();
}

async function updateSettings(payload) {
  const allowed = {};
  if (payload.reminderDays) allowed.reminderDays = payload.reminderDays;
  if (payload.whatsappTemplates) allowed.whatsappTemplates = payload.whatsappTemplates;
  if (payload.paymentInstructions !== undefined) {
    allowed.paymentInstructions = payload.paymentInstructions;
  }
  if (payload.supportContact !== undefined) allowed.supportContact = payload.supportContact;
  if (payload.timezone) allowed.timezone = payload.timezone;
  return settingsRepository.updateSettings(allowed);
}

module.exports = { getSettings, updateSettings };
