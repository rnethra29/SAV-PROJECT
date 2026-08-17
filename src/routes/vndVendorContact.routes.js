'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateContact } = require('../validators/vndVendorContact.validator');
const vndVendorContactController = require('../controllers/vndVendorContact.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), vndVendorContactController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_MANAGER, ROLES.PROCUREMENT_OFFICER), validate(idP, 'params'), validate(updateContact), vndVendorContactController.update);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), vndVendorContactController.remove);

module.exports = router;
