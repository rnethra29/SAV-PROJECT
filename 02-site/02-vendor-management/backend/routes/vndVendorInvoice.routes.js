'use strict';

const { Router } = require('express');
const authenticate = require('../../../../shared/backend/middlewares/auth.middleware');
const requireRole = require('../../../../shared/backend/middlewares/role.middleware');
const validate = require('../../../../shared/backend/middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../../../../shared/backend/validators/common.validator');
const { createVendorInvoice, updateVendorInvoice } = require('../validators/vndVendorInvoice.validator');
const { createInvoiceItemForInvoice } = require('../validators/vndVendorInvoiceItem.validator');

const vndVendorInvoiceController = require('../controllers/vndVendorInvoice.controller');
const vndVendorInvoiceItemController = require('../controllers/vndVendorInvoiceItem.controller');

const { ROLES } = require('../../../../shared/backend/models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const nestedInvoiceIdParam = idParam('invoiceId');

/**
 * @openapi
 * tags:
 *   - name: Vendors/Invoices
 *     description: Invoices received from vendors, reconciled against PO items (Sites module, doc §6.13-6.14/§13)
 */
router.get('/', validate(paginationQuery, 'query'), vndVendorInvoiceController.list);
router.post('/', requireRole(ROLES.ACCOUNTANT), validate(createVendorInvoice), vndVendorInvoiceController.create);
router.get('/:id', validate(idP, 'params'), vndVendorInvoiceController.getById);
router.get('/:id/summary', validate(idP, 'params'), vndVendorInvoiceController.getSummary);
router.patch('/:id', requireRole(ROLES.ACCOUNTANT, ROLES.FINANCE_MANAGER), validate(idP, 'params'), validate(updateVendorInvoice), vndVendorInvoiceController.update);
router.post('/:id/verify', requireRole(ROLES.ACCOUNTANT), validate(idP, 'params'), vndVendorInvoiceController.verify);
router.delete('/:id', requireRole(ROLES.ACCOUNTANT, ROLES.FINANCE_MANAGER), validate(idP, 'params'), vndVendorInvoiceController.remove);

// Invoice lines, nested under their parent invoice
router.get('/:invoiceId/items', validate(nestedInvoiceIdParam, 'params'), vndVendorInvoiceItemController.listByInvoice);
router.post(
  '/:invoiceId/items',
  requireRole(ROLES.ACCOUNTANT),
  validate(nestedInvoiceIdParam, 'params'),
  validate(createInvoiceItemForInvoice),
  vndVendorInvoiceItemController.createUnderInvoice
);

module.exports = router;
