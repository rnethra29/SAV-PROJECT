'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createRfq, updateRfq } = require('../validators/rfq.validator');
const { createRfqItemForRfq } = require('../validators/rfqItem.validator');
const rfqController = require('../controllers/rfq.controller');
const rfqItemController = require('../controllers/rfqItem.controller');
const { ROLES } = require('../models/enums');

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
