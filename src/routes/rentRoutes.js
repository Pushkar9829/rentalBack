const express = require('express');
const rentController = require('../controllers/rentController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators');

const router = express.Router();
router.use(authenticate);

router.get('/', rentController.list);
router.post('/generate', rentController.generate);
router.get('/:id', idParam, validate, rentController.getById);
router.patch('/:id/mark-paid', idParam, validate, rentController.markPaid);
router.patch('/:id/mark-pending', idParam, validate, rentController.markPending);
router.post('/:id/send-request', idParam, validate, rentController.sendRequest);
router.post('/:id/send-reminder', idParam, validate, rentController.sendReminder);
router.patch('/:id/amount', idParam, validate, rentController.updateAmount);

module.exports = router;
