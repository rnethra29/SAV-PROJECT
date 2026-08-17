'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../../shared/backend/validators/common.validator');
const { updateClientContact } = require('../validators/clmClientContact.validator');
const clmClientContactController = require('../controllers/clmClientContact.controller');
const { ROLES } = require('../../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), clmClientContactController.getById);
router.patch('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), validate(updateClientContact), clmClientContactController.update);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), clmClientContactController.remove);

module.exports = router;
