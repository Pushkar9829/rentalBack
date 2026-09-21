const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators');

const router = express.Router();

router.post('/webhook', paymentController.webhook);
router.post('/:id/link', authenticate, idParam, validate, paymentController.createLink);

module.exports = router;
