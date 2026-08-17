'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateInvoiceItem } = require('../validators/vndVendorInvoiceItem.validator');
const vndVendorInvoiceItemController = require('../controllers/vndVendorInvoiceItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), vndVendorInvoiceItemController.getById);
router.patch('/:id', requireRole(ROLES.ACCOUNTANT), validate(idP, 'params'), validate(updateInvoiceItem), vndVendorInvoiceItemController.update);
router.delete('/:id', requireRole(ROLES.ACCOUNTANT), validate(idP, 'params'), vndVendorInvoiceItemController.remove);

module.exports = router;
