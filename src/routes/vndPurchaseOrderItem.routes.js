'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateItem } = require('../validators/vndPurchaseOrderItem.validator');
const vndPurchaseOrderItemController = require('../controllers/vndPurchaseOrderItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), vndPurchaseOrderItemController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_OFFICER), validate(idP, 'params'), validate(updateItem), vndPurchaseOrderItemController.update);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_OFFICER), validate(idP, 'params'), vndPurchaseOrderItemController.remove);

module.exports = router;
