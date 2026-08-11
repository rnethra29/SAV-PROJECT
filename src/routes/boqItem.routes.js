'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateBoqItem } = require('../validators/boqItem.validator');
const boqItemController = require('../controllers/boqItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

router.get('/:id', validate(idP, 'params'), boqItemController.getById);
router.patch(
  '/:id',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.PROCUREMENT_TEAM),
  validate(idP, 'params'),
  validate(updateBoqItem),
  boqItemController.update
);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.PROCUREMENT_TEAM), validate(idP, 'params'), boqItemController.remove);

module.exports = router;
