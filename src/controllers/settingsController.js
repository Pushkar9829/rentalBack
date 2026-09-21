const settingsService = require('../services/settingsService');
const { success } = require('../utils/response');

async function get(req, res, next) {
  try {
    const data = await settingsService.getSettings();
    return success(res, 200, 'Settings', data);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = await settingsService.updateSettings(req.body);
    return success(res, 200, 'Settings updated', data);
  } catch (err) {
    next(err);
  }
}

module.exports = { get, update };
