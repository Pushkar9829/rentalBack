const tenantPortalService = require('../services/tenantPortalService');
const { success } = require('../utils/response');

async function login(req, res, next) {
  try {
    const data = await tenantPortalService.login(req.body.mobile, req.body.password);
    return success(res, 200, 'Login successful', data);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const data = await tenantPortalService.getProfile(req.tenant._id);
    return success(res, 200, 'Profile', data);
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const data = await tenantPortalService.getPortalSummary(req.tenant._id);
    return success(res, 200, 'Portal summary', data);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  return success(res, 200, 'Logged out');
}

module.exports = { login, me, summary, logout };
