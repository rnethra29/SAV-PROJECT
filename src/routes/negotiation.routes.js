'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createNegotiationOffer } = require('../validators/negotiation.validator');
const negotiationController = require('../controllers/negotiation.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: Negotiation
 *     description: Append-only client offer / counter-offer history (architecture Phase 5.10)
 */
router.get('/by-quotation/:quotationId', validate(idParam('quotationId'), 'params'), validate(paginationQuery, 'query'), negotiationController.listByQuotation);
router.get(
  '/by-quotation-item/:quotationItemId',
  validate(idParam('quotationItemId'), 'params'),
  validate(paginationQuery, 'query'),
  negotiationController.listByQuotationItem
);
router.get('/by-quotation-item/:quotationItemId/final', validate(idParam('quotationItemId'), 'params'), negotiationController.getFinal);
router.post(
  '/',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.APPROVER),
  validate(createNegotiationOffer),
  negotiationController.create
);

module.exports = router;
