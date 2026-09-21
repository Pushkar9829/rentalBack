const express = require('express');
const tenantController = require('../controllers/tenantController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { tenantValidators, idParam } = require('../validators');

const router = express.Router();
router.use(authenticate);

router.get('/', tenantController.list);
router.post('/', tenantValidators, validate, tenantController.create);
router.get('/:id', idParam, validate, tenantController.getById);
router.put('/:id', idParam, validate, tenantController.update);
router.patch('/:id/deactivate', idParam, validate, tenantController.deactivate);
router.delete('/:id', idParam, validate, tenantController.remove);

module.exports = router;
