'use strict';

const { Router } = require('express');
const authenticate = require('../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../shared/backend/validators/common.validator');
const { updateQuotationItem } = require('./quotationItem.validator');
const quotationItemController = require('./quotationItem.controller');
const { ROLES } = require('../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), quotationItemController.getById);
router.patch('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), validate(updateQuotationItem), quotationItemController.update);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), quotationItemController.remove);

module.exports = router;
