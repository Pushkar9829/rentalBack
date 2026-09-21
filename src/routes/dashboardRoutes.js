const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', dashboardController.getDashboard);
router.get('/reports', dashboardController.getReport);
router.get('/reports/export', dashboardController.exportCsv);

module.exports = router;
