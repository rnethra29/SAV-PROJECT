'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../../shared/backend/validators/common.validator');
const { updateBankAccount } = require('../validators/vndVendorBankAccount.validator');
const vndVendorBankAccountController = require('../controllers/vndVendorBankAccount.controller');
const { ROLES } = require('../../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), vndVendorBankAccountController.getById);
// Separately-permissioned reveal endpoint (doc §20) - masked account_number/upi_id everywhere else.
router.get('/:id/reveal', requireRole(ROLES.FINANCE_MANAGER, ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), vndVendorBankAccountController.reveal);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER), validate(idP, 'params'), validate(updateBankAccount), vndVendorBankAccountController.update);
router.post('/:id/verify', requireRole(ROLES.FINANCE_MANAGER), validate(idP, 'params'), vndVendorBankAccountController.verify);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), vndVendorBankAccountController.remove);

module.exports = router;
