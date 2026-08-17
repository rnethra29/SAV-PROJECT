'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createPayment, updatePayment, decidePaymentStatus, createAllocationForPayment } = require('../validators/vndVendorPayment.validator');
const vndVendorPaymentController = require('../controllers/vndVendorPayment.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const nestedPaymentIdParam = idParam('paymentId');

/**
 * @openapi
 * tags:
 *   - name: Vendors/Payments
 *     description: Money paid to vendors + payment-to-invoice allocations (Sites module, doc §6.15-6.16)
 */
router.get('/', validate(paginationQuery, 'query'), vndVendorPaymentController.list);
router.post('/', requireRole(ROLES.ACCOUNTANT), validate(createPayment), vndVendorPaymentController.create);
router.get('/:id', validate(idP, 'params'), vndVendorPaymentController.getById);
router.patch('/:id', requireRole(ROLES.ACCOUNTANT), validate(idP, 'params'), validate(updatePayment), vndVendorPaymentController.update);
router.post('/:id/approve', requireRole(ROLES.FINANCE_MANAGER), validate(idP, 'params'), vndVendorPaymentController.approve);
router.post('/:id/status', requireRole(ROLES.FINANCE_MANAGER, ROLES.ACCOUNTANT), validate(idP, 'params'), validate(decidePaymentStatus), vndVendorPaymentController.decideStatus);

// Payment allocations, nested under their parent payment (append-only - no update/delete)
router.get('/:paymentId/allocations', validate(nestedPaymentIdParam, 'params'), vndVendorPaymentController.listAllocations);
router.post(
  '/:paymentId/allocations',
  requireRole(ROLES.ACCOUNTANT),
  validate(nestedPaymentIdParam, 'params'),
  validate(createAllocationForPayment),
  vndVendorPaymentController.createAllocation
);

module.exports = router;
