'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateQuotationItem } = require('../validators/quotationItem.validator');
const quotationItemController = require('../controllers/quotationItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), quotationItemController.getById);
router.patch('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), validate(updateQuotationItem), quotationItemController.update);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), quotationItemController.remove);

module.exports = router;
