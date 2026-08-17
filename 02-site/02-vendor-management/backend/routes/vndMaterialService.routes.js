'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../../shared/backend/validators/common.validator');
const { updateMaterialService } = require('../validators/vndMaterialService.validator');
const vndMaterialServiceController = require('../controllers/vndMaterialService.controller');
const { ROLES } = require('../../../../shared/backend/models/enums');

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
