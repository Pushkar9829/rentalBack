const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);
router.get('/', notificationController.list);

module.exports = router;
