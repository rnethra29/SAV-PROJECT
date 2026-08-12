'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateInvoiceLine } = require('../validators/clmClientInvoiceLine.validator');
const clmClientInvoiceLineController = require('../controllers/clmClientInvoiceLine.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), clmClientInvoiceLineController.getById);
router.patch('/:id', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(idP, 'params'), validate(updateInvoiceLine), clmClientInvoiceLineController.update);
router.delete('/:id', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(idP, 'params'), clmClientInvoiceLineController.remove);

module.exports = router;
