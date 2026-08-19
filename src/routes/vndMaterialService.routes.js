'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateMaterialService } = require('../validators/vndMaterialService.validator');
const vndMaterialServiceController = require('../controllers/vndMaterialService.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), vndMaterialServiceController.getById);
router.patch(
  '/:id',
  requireRole(ROLES.PROCUREMENT_OFFICER, ROLES.PROCUREMENT_MANAGER),
  validate(idP, 'params'),
  validate(updateMaterialService),
  vndMaterialServiceController.update
);
router.post('/:id/deactivate', requireRole(ROLES.PROCUREMENT_OFFICER, ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), vndMaterialServiceController.deactivate);

module.exports = router;
