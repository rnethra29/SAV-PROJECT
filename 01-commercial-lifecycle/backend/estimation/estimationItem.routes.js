'use strict';

const { Router } = require('express');
const authenticate = require('../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../shared/backend/validators/common.validator');
const { updateEstimationItem } = require('./estimationItem.validator');
const estimationItemController = require('./estimationItem.controller');
const { ROLES } = require('../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), estimationItemController.getById);
router.get('/:id/cost-breakup', validate(idP, 'params'), estimationItemController.getCostBreakup);
router.patch('/:id', requireRole(ROLES.ESTIMATION_ENGINEER), validate(idP, 'params'), validate(updateEstimationItem), estimationItemController.update);
router.delete('/:id', requireRole(ROLES.ESTIMATION_ENGINEER), validate(idP, 'params'), estimationItemController.remove);

module.exports = router;
