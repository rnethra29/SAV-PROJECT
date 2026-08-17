'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createPurchaseOrder, updatePurchaseOrder, decideApprovalStage, receivePoItems } = require('../validators/vndPurchaseOrder.validator');
const { createItemForPo } = require('../validators/vndPurchaseOrderItem.validator');

const vndPurchaseOrderController = require('../controllers/vndPurchaseOrder.controller');
const vndPurchaseOrderItemController = require('../controllers/vndPurchaseOrderItem.controller');

const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const nestedPoIdParam = idParam('poId');

/**
 * @openapi
 * tags:
 *   - name: Vendors/PurchaseOrders
 *     description: Direct procurement PO (distinct from com_po, the Commercial Lifecycle subcontract PO) - Sites module, doc §0/§6.11-6.12/§13
 */
router.get('/', validate(paginationQuery, 'query'), vndPurchaseOrderController.list);
router.post('/', requireRole(ROLES.PROCUREMENT_OFFICER), validate(createPurchaseOrder), vndPurchaseOrderController.create);
router.get('/:id', validate(idP, 'params'), vndPurchaseOrderController.getById);
router.patch('/:id', requireRole(ROLES.PROCUREMENT_OFFICER, ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), validate(updatePurchaseOrder), vndPurchaseOrderController.update);
router.post('/:id/submit', requireRole(ROLES.PROCUREMENT_OFFICER), validate(idP, 'params'), vndPurchaseOrderController.submit);
router.post(
  '/:id/approve',
  requireRole(ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER),
  validate(idP, 'params'),
  validate(decideApprovalStage),
  vndPurchaseOrderController.decideApprovalStage
);
router.post(
  '/:id/receive',
  requireRole(ROLES.SITE_ENGINEER, ROLES.PROCUREMENT_OFFICER),
  validate(idP, 'params'),
  validate(receivePoItems),
  vndPurchaseOrderController.receive
);
router.post('/:id/cancel', requireRole(ROLES.PROCUREMENT_OFFICER, ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), vndPurchaseOrderController.cancel);
router.delete('/:id', requireRole(ROLES.PROCUREMENT_MANAGER), validate(idP, 'params'), vndPurchaseOrderController.remove);

// PO items, nested under their parent PO
router.get('/:poId/items', validate(nestedPoIdParam, 'params'), vndPurchaseOrderItemController.listByPo);
router.post(
  '/:poId/items',
  requireRole(ROLES.PROCUREMENT_OFFICER),
  validate(nestedPoIdParam, 'params'),
  validate(createItemForPo),
  vndPurchaseOrderItemController.createUnderPo
);

module.exports = router;
