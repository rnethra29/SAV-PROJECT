'use strict';

const { Router } = require('express');
const Joi = require('joi');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createBoq, generateTentativeFromQuotation, createNewVersion, updateBoq } = require('../validators/boq.validator');
const { createBoqItemForBoq } = require('../validators/boqItem.validator');
const boqController = require('../controllers/boq.controller');
const boqItemController = require('../controllers/boqItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const boqIdP = idParam('boqId');
const boqNumberP = Joi.object({ boqNumber: Joi.string().max(50).required() });

/**
 * @openapi
 * tags:
 *   - name: BOQ
 *     description: Versioned, hierarchical Bill of Quantities - Tentative -> Final (architecture Phase 5.11/5.12)
 */
router.get('/', validate(paginationQuery, 'query'), boqController.list);
router.post('/', requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.PROCUREMENT_TEAM), validate(createBoq), boqController.create);
router.post(
  '/generate-from-quotation',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.PROCUREMENT_TEAM),
  validate(generateTentativeFromQuotation),
  boqController.generateTentativeFromQuotation
);
router.get('/by-number/:boqNumber/versions', validate(boqNumberP, 'params'), boqController.getVersions);
router.get('/:id', validate(idP, 'params'), boqController.getById);
router.patch('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.APPROVER, ROLES.PROCUREMENT_TEAM), validate(idP, 'params'), validate(updateBoq), boqController.update);
router.post(
  '/:id/new-version',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.PROCUREMENT_TEAM),
  validate(idP, 'params'),
  validate(createNewVersion),
  boqController.createNewVersion
);
router.delete('/:id', requireRole(ROLES.SALES_COMMERCIAL_MANAGER), validate(idP, 'params'), boqController.remove);

router.get('/:boqId/items', validate(boqIdP, 'params'), boqItemController.listByBoq);
router.get('/:boqId/items/tree', validate(boqIdP, 'params'), boqItemController.getTree);
router.post(
  '/:boqId/items',
  requireRole(ROLES.SALES_COMMERCIAL_MANAGER, ROLES.PROCUREMENT_TEAM),
  validate(boqIdP, 'params'),
  validate(createBoqItemForBoq),
  boqItemController.createUnderBoq
);

module.exports = router;
