'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updatePoItem } = require('../validators/poItem.validator');
const poItemController = require('../controllers/poItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), poItemController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_TEAM), validate(idP, 'params'), validate(updatePoItem), poItemController.update);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_TEAM), validate(idP, 'params'), poItemController.remove);

module.exports = router;
