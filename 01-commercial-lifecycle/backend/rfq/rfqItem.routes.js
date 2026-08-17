'use strict';

const { Router } = require('express');
const authenticate = require('../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../shared/backend/middlewares/validation.middleware');
const { idParam } = require('../../../shared/backend/validators/common.validator');
const { updateRfqItem } = require('./rfqItem.validator');
const rfqItemController = require('./rfqItem.controller');
const { ROLES } = require('../../../shared/backend/models/enums');

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
