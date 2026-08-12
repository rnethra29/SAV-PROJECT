'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createPayment, updatePayment, decideVerification, createAllocationForPayment } = require('../validators/clmPayment.validator');
const clmPaymentController = require('../controllers/clmPayment.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const nestedPaymentIdParam = idParam('paymentId');

/**
 * @openapi
 * tags:
 *   - name: ClientManagement/Payments
 *     description: Client payment transactions + payment-to-invoice allocations (Sites module, Client Management submodule)
 */
router.get('/', validate(paginationQuery, 'query'), clmPaymentController.list);
router.post('/', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(createPayment), clmPaymentController.create);
router.get('/:id', validate(idP, 'params'), clmPaymentController.getById);
router.patch('/:id', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(idP, 'params'), validate(updatePayment), clmPaymentController.update);
router.post('/:id/verify', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(idP, 'params'), validate(decideVerification), clmPaymentController.decideVerification);
router.delete('/:id', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(idP, 'params'), clmPaymentController.remove);

// Payment allocations, nested under their parent payment (append-only - no update/delete)
router.get('/:paymentId/allocations', validate(nestedPaymentIdParam, 'params'), clmPaymentController.listAllocations);
router.post(
  '/:paymentId/allocations',
  requireRole(ROLES.FINANCE_ACCOUNTS_TEAM),
  validate(nestedPaymentIdParam, 'params'),
  validate(createAllocationForPayment),
  clmPaymentController.createAllocation
);

module.exports = router;
