'use strict';

const { Router } = require('express');
const authenticate = require('../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../shared/backend/validators/common.validator');
const { updatePoItem } = require('./poItem.validator');
const poItemController = require('./poItem.controller');
const { ROLES } = require('../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), poItemController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_TEAM), validate(idP, 'params'), validate(updatePoItem), poItemController.update);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_TEAM), validate(idP, 'params'), poItemController.remove);

module.exports = router;
