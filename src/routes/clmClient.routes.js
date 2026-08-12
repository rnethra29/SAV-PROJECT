'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createClient, updateClient } = require('../validators/clmClient.validator');
const { createClientContactForClient } = require('../validators/clmClientContact.validator');
const { createClientRequirementForClient } = require('../validators/clmClientRequirement.validator');
const { createClientInvoiceForClient } = require('../validators/clmClientInvoice.validator');
const { createPaymentForClient } = require('../validators/clmPayment.validator');

const clmClientController = require('../controllers/clmClient.controller');
const clmClientContactController = require('../controllers/clmClientContact.controller');
const clmClientRequirementController = require('../controllers/clmClientRequirement.controller');
const clmClientInvoiceController = require('../controllers/clmClientInvoice.controller');
const clmPaymentController = require('../controllers/clmPayment.controller');
const clmClient360Controller = require('../controllers/clmClient360.controller');

const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const clientIdParam = idParam('id');
const nestedClientIdParam = idParam('clientId');

/**
 * @openapi
 * tags:
 *   - name: ClientManagement/Clients
 *     description: Client master + nested contacts/requirements/invoices/payments + Client 360 (Sites module, Client Management submodule)
 */
router.get('/', validate(paginationQuery, 'query'), clmClientController.list);
router.post('/', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(createClient), clmClientController.create);
router.get('/:id', validate(clientIdParam, 'params'), clmClientController.getById);
router.patch('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(clientIdParam, 'params'), validate(updateClient), clmClientController.update);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(clientIdParam, 'params'), clmClientController.remove);

// ---- Client 360 + read-only cross-module proxies (doc §18) ----
router.get('/:clientId/360', validate(nestedClientIdParam, 'params'), clmClient360Controller.getOverview);
router.get('/:clientId/rfqs', validate(nestedClientIdParam, 'params'), validate(paginationQuery, 'query'), clmClient360Controller.getRfqs);
router.get('/:clientId/projects', validate(nestedClientIdParam, 'params'), clmClient360Controller.getProjects);
router.get('/:clientId/documents', validate(nestedClientIdParam, 'params'), clmClient360Controller.getDocuments);
router.get('/:clientId/activity', validate(nestedClientIdParam, 'params'), validate(paginationQuery, 'query'), clmClient360Controller.getActivity);

// ---- Contacts, nested under their parent client ----
router.get('/:clientId/contacts', validate(nestedClientIdParam, 'params'), clmClientContactController.listByClient);
router.post(
  '/:clientId/contacts',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER),
  validate(nestedClientIdParam, 'params'),
  validate(createClientContactForClient),
  clmClientContactController.createUnderClient
);

// ---- Requirements, nested under their parent client ----
router.get('/:clientId/requirements', validate(nestedClientIdParam, 'params'), validate(paginationQuery, 'query'), clmClientRequirementController.listByClient);
router.post(
  '/:clientId/requirements',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.ESTIMATION_ENGINEER),
  validate(nestedClientIdParam, 'params'),
  validate(createClientRequirementForClient),
  clmClientRequirementController.createUnderClient
);

// ---- Invoices, nested under their parent client ----
router.get('/:clientId/invoices', validate(nestedClientIdParam, 'params'), validate(paginationQuery, 'query'), clmClientInvoiceController.listByClient);
router.post(
  '/:clientId/invoices',
  requireRole(ROLES.FINANCE_ACCOUNTS_TEAM),
  validate(nestedClientIdParam, 'params'),
  validate(createClientInvoiceForClient),
  clmClientInvoiceController.createUnderClient
);

// ---- Payments, nested under their parent client ----
router.get('/:clientId/payments', validate(nestedClientIdParam, 'params'), validate(paginationQuery, 'query'), clmPaymentController.listByClient);
router.post(
  '/:clientId/payments',
  requireRole(ROLES.FINANCE_ACCOUNTS_TEAM),
  validate(nestedClientIdParam, 'params'),
  validate(createPaymentForClient),
  clmPaymentController.createUnderClient
);

module.exports = router;
