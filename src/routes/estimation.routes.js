'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam, paginationQuery } = require('../validators/common.validator');
const { createEstimation, updateEstimation } = require('../validators/estimation.validator');
const { createEstimationItemForEstimation } = require('../validators/estimationItem.validator');
const estimationController = require('../controllers/estimation.controller');
const estimationItemController = require('../controllers/estimationItem.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);

const idP = idParam('id');
const estimationIdP = idParam('estimationId');

/**
 * @openapi
 * tags:
 *   - name: Estimation
 *     description: Item-level cost build-up per RFQ item S.No (architecture Phase 5.3/5.4)
 */
router.get('/', validate(paginationQuery, 'query'), estimationController.list);
router.post('/', requireRole(ROLES.ESTIMATION_ENGINEER), validate(createEstimation), estimationController.create);
router.get('/:id', validate(idP, 'params'), estimationController.getById);
router.patch('/:id', requireRole(ROLES.ESTIMATION_ENGINEER, ROLES.APPROVER), validate(idP, 'params'), validate(updateEstimation), estimationController.update);
router.delete('/:id', requireRole(ROLES.ESTIMATION_ENGINEER), validate(idP, 'params'), estimationController.remove);

router.get('/:estimationId/items', validate(estimationIdP, 'params'), estimationItemController.listByEstimation);
router.post(
  '/:estimationId/items',
  requireRole(ROLES.ESTIMATION_ENGINEER),
  validate(estimationIdP, 'params'),
  validate(createEstimationItemForEstimation),
  estimationItemController.createUnderEstimation
);

module.exports = router;
