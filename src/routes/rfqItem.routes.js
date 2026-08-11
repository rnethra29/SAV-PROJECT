'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { updateRfqItem } = require('../validators/rfqItem.validator');
const rfqItemController = require('../controllers/rfqItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const itemIdParam = idParam('id');

/**
 * @openapi
 * tags:
 *   - name: RFQItems
 *     description: Direct single-item operations (creation happens under /rfqs/:rfqId/items)
 */
router.get('/:id', validate(itemIdParam, 'params'), rfqItemController.getById);
router.patch(
  '/:id',
  requireRole(ROLES.ESTIMATION_ENGINEER, ROLES.SALES_COMMERCIAL_MANAGER),
  validate(itemIdParam, 'params'),
  validate(updateRfqItem),
  rfqItemController.update
);
router.delete('/:id', requireRole(ROLES.ESTIMATION_ENGINEER, ROLES.SALES_COMMERCIAL_MANAGER), validate(itemIdParam, 'params'), rfqItemController.remove);

module.exports = router;
