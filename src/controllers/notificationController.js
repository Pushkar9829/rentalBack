const notificationService = require('../services/notificationService');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const data = await notificationService.listNotifications(req.query);
    return success(res, 200, 'Notifications', data);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
