'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../../shared/backend/validators/common.validator');
const { updateItem } = require('../validators/vndPurchaseOrderItem.validator');
const vndPurchaseOrderItemController = require('../controllers/vndPurchaseOrderItem.controller');
const { ROLES } = require('../../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), vndPurchaseOrderItemController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_OFFICER), validate(idP, 'params'), validate(updateItem), vndPurchaseOrderItemController.update);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_OFFICER), validate(idP, 'params'), vndPurchaseOrderItemController.remove);

module.exports = router;
