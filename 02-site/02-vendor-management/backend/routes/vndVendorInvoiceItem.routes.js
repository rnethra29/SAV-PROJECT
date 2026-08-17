'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../../shared/backend/validators/common.validator');
const { updateInvoiceItem } = require('../validators/vndVendorInvoiceItem.validator');
const vndVendorInvoiceItemController = require('../controllers/vndVendorInvoiceItem.controller');
const { ROLES } = require('../../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), vndVendorInvoiceItemController.getById);
router.patch('/:id', requireRole(ROLES.ACCOUNTANT), validate(idP, 'params'), validate(updateInvoiceItem), vndVendorInvoiceItemController.update);
router.delete('/:id', requireRole(ROLES.ACCOUNTANT), validate(idP, 'params'), vndVendorInvoiceItemController.remove);

module.exports = router;
