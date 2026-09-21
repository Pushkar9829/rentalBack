const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);
router.get('/', settingsController.get);
router.put('/', settingsController.update);

module.exports = router;
