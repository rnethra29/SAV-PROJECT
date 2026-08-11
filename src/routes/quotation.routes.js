'use strict';

const { Router } = require('express');
const Joi = require('joi');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createQuotation, createNewVersion, updateQuotation } = require('../validators/quotation.validator');
const { createQuotationItemForQuotation } = require('../validators/quotationItem.validator');
const quotationController = require('../controllers/quotation.controller');
const quotationItemController = require('../controllers/quotationItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const quotationIdP = idParam('quotationId');
const quotationNumberP = Joi.object({ quotationNumber: Joi.string().max(50).required() });

/**
 * @openapi
 * tags:
 *   - name: Quotation
 *     description: Versioned quotation header + items (architecture Phase 5.8/5.9, rule #5)
 */
router.get('/', validate(paginationQuery, 'query'), quotationController.list);
router.post('/', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(createQuotation), quotationController.create);
router.get('/by-number/:quotationNumber/versions', validate(quotationNumberP, 'params'), quotationController.getVersions);
router.get('/:id', validate(idP, 'params'), quotationController.getById);
router.patch('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.APPROVER), validate(idP, 'params'), validate(updateQuotation), quotationController.update);
router.post(
  '/:id/new-version',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER),
  validate(idP, 'params'),
  validate(createNewVersion),
  quotationController.createNewVersion
);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), quotationController.remove);

router.get('/:quotationId/items', validate(quotationIdP, 'params'), quotationItemController.listByQuotation);
router.post(
  '/:quotationId/items',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER),
  validate(quotationIdP, 'params'),
  validate(createQuotationItemForQuotation),
  quotationItemController.createUnderQuotation
);

module.exports = router;
