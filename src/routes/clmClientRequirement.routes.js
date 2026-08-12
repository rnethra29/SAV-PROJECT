'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createClientRequirement, updateClientRequirement } = require('../validators/clmClientRequirement.validator');
const clmClientRequirementController = require('../controllers/clmClientRequirement.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

/**
 * @openapi
 * tags:
 *   - name: ClientManagement/Requirements
 *     description: Pre-RFQ client requirement capture (Sites module, Client Management submodule)
 */
router.get('/', validate(paginationQuery, 'query'), clmClientRequirementController.list);
router.post('/', requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.ESTIMATION_ENGINEER), validate(createClientRequirement), clmClientRequirementController.create);
router.get('/:id', validate(idP, 'params'), clmClientRequirementController.getById);
router.patch(
  '/:id',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.ESTIMATION_ENGINEER),
  validate(idP, 'params'),
  validate(updateClientRequirement),
  clmClientRequirementController.update
);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), clmClientRequirementController.remove);

module.exports = router;
