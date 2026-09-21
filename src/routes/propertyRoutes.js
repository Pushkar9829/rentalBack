const express = require('express');
const propertyController = require('../controllers/propertyController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { propertyValidators, idParam } = require('../validators');

const router = express.Router();
router.use(authenticate);

router.get('/', propertyController.list);
router.post('/', propertyValidators, validate, propertyController.create);
router.get('/:id', idParam, validate, propertyController.getById);
router.put('/:id', idParam, validate, propertyController.update);
router.delete('/:id', idParam, validate, propertyController.remove);

module.exports = router;
