const express = require('express');
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.post('/run-monthly', jobController.runMonthly);
router.post('/run-reminders', jobController.runReminderJob);
router.post('/run-overdue', jobController.runOverdue);

module.exports = router;
