const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const tenantPortalController = require('../controllers/tenantPortalController');
const { authenticateTenant } = require('../middlewares/tenantAuth');
const validate = require('../middlewares/validate');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'Too many login attempts' },
});

router.post(
  '/login',
  loginLimiter,
  [
    body('mobile').trim().notEmpty().withMessage('Mobile required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  tenantPortalController.login
);

router.get('/me', authenticateTenant, tenantPortalController.me);
router.get('/summary', authenticateTenant, tenantPortalController.summary);
router.post('/logout', authenticateTenant, tenantPortalController.logout);

module.exports = router;
