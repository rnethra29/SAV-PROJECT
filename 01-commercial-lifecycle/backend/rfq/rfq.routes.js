'use strict';

const { Router } = require('express');
const authenticate = require('../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../shared/backend/middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../../../shared/backend/validators/common.validator');
const { createRfq, updateRfq } = require('./rfq.validator');
const { createRfqItemForRfq } = require('./rfqItem.validator');
const rfqController = require('./rfq.controller');
const rfqItemController = require('./rfqItem.controller');
const { ROLES } = require('../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);

const rfqIdParam = idParam('id');
const nestedRfqIdParam = idParam('rfqId');

/**
 * @openapi
 * tags:
 *   - name: RFQ
 *     description: Client RFQ header + hierarchical RFQ items (architecture Phase 5.1/5.2)
 */
router.get('/', validate(paginationQuery, 'query'), rfqController.list);
router.post('/', requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.ESTIMATION_ENGINEER), validate(createRfq), rfqController.create);
router.get('/:id', validate(rfqIdParam, 'params'), rfqController.getById);
router.patch('/:id', validate(rfqIdParam, 'params'), validate(updateRfq), rfqController.update);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(rfqIdParam, 'params'), rfqController.remove);

// RFQ items, nested under their parent RFQ
router.get('/:rfqId/items', validate(nestedRfqIdParam, 'params'), rfqItemController.listByRfq);
router.get('/:rfqId/items/tree', validate(nestedRfqIdParam, 'params'), rfqItemController.getTree);
router.post(
  '/:rfqId/items',
  requireRole(ROLES.ESTIMATION_ENGINEER, ROLES.SALES_COMMERCIAL_MANAGER),
  validate(nestedRfqIdParam, 'params'),
  validate(createRfqItemForRfq),
  rfqItemController.createUnderRfq
);

module.exports = router;
