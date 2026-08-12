'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createClientInvoice, updateClientInvoice } = require('../validators/clmClientInvoice.validator');
const { createInvoiceLineForInvoice } = require('../validators/clmClientInvoiceLine.validator');
const clmClientInvoiceController = require('../controllers/clmClientInvoice.controller');
const clmClientInvoiceLineController = require('../controllers/clmClientInvoiceLine.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const nestedInvoiceIdParam = idParam('invoiceId');

/**
 * @openapi
 * tags:
 *   - name: ClientManagement/Invoices
 *     description: Client billing header + invoice lines (Sites module, Client Management submodule)
 */
router.get('/', validate(paginationQuery, 'query'), clmClientInvoiceController.list);
router.post('/', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(createClientInvoice), clmClientInvoiceController.create);
router.get('/:id', validate(idP, 'params'), clmClientInvoiceController.getById);
router.patch('/:id', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM, ROLES.APPROVER), validate(idP, 'params'), validate(updateClientInvoice), clmClientInvoiceController.update);
router.delete('/:id', requireRole(ROLES.FINANCE_ACCOUNTS_TEAM), validate(idP, 'params'), clmClientInvoiceController.remove);

// Invoice lines, nested under their parent invoice
router.get('/:invoiceId/lines', validate(nestedInvoiceIdParam, 'params'), clmClientInvoiceLineController.listByInvoice);
router.post(
  '/:invoiceId/lines',
  requireRole(ROLES.FINANCE_ACCOUNTS_TEAM),
  validate(nestedInvoiceIdParam, 'params'),
  validate(createInvoiceLineForInvoice),
  clmClientInvoiceLineController.createUnderInvoice
);

module.exports = router;
