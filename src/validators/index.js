const { body, param, query } = require('express-validator');

const loginValidators = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const tenantValidators = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('mobile').trim().notEmpty().withMessage('Mobile required'),
  body('whatsappNumber').trim().notEmpty().withMessage('WhatsApp number required'),
  body('monthlyRent').isFloat({ min: 0 }).withMessage('Monthly rent required'),
  body('status').optional().isIn(['active', 'inactive', 'vacated']),
];

const propertyValidators = [
  body('name').trim().notEmpty().withMessage('Property name required'),
  body('address').trim().notEmpty().withMessage('Address required'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid id')];

const rentMonthQuery = [
  query('rentMonth')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('rentMonth must be YYYY-MM'),
];

module.exports = {
  loginValidators,
  tenantValidators,
  propertyValidators,
  idParam,
  rentMonthQuery,
};
