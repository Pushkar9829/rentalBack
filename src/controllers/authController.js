const authService = require('../services/authService');
const { success } = require('../utils/response');

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body.email, req.body.password);
    return success(res, 200, 'Login successful', data);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const data = await authService.getProfile(req.admin._id);
    return success(res, 200, 'Profile', data);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  return success(res, 200, 'Logged out');
}

module.exports = { login, me, logout };
