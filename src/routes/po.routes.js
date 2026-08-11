'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createPo, generateFromBoq, updatePo } = require('../validators/po.validator');
const { createPoItemForPo } = require('../validators/poItem.validator');
const poController = require('../controllers/po.controller');
const poItemController = require('../controllers/poItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const poIdP = idParam('poId');

/**
 * @openapi
 * tags:
 *   - name: PurchaseOrder
 *     description: PO header + items, raised against a Final BOQ (architecture Phase 5.13/5.14)
 */
router.get('/', validate(paginationQuery, 'query'), poController.list);
router.post('/', requireRole(ROLES.PROCUREMENT_TEAM), validate(createPo), poController.create);
router.post('/generate-from-boq', requireRole(ROLES.PROCUREMENT_TEAM), validate(generateFromBoq), poController.generateFromBoq);
router.get('/:id', validate(idP, 'params'), poController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_TEAM, ROLES.APPROVER), validate(idP, 'params'), validate(updatePo), poController.update);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_TEAM), validate(idP, 'params'), poController.remove);

router.get('/:poId/items', validate(poIdP, 'params'), poItemController.listByPo);
router.post(
  '/:poId/items',
  requireRole(ROLES.PROCUREMENT_TEAM),
  validate(poIdP, 'params'),
  validate(createPoItemForPo),
  poItemController.createUnderPo
);

module.exports = router;
