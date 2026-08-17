'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../../shared/backend/validators/common.validator');
const { updateCost } = require('../validators/clmProjectCost.validator');
const clmProjectCostController = require('../controllers/clmProjectCost.controller');
const { ROLES } = require('../../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), clmProjectCostController.getById);
router.patch('/:id', requireRole(ROLES.PROJECT_MANAGER), validate(idP, 'params'), validate(updateCost), clmProjectCostController.update);

module.exports = router;
