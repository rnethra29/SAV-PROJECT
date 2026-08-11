'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { idParam } = require('../validators/common.validator');
const { requestApproval, approveDecision, rejectDecision, entityParams } = require('../validators/approval.validator');
const approvalController = require('../controllers/approval.controller');
const { ROLES } = require('../models/enums');

const router = Router();
router.use(authenticate);
const idP = idParam('id');

/**
 * @openapi
 * tags:
 *   - name: Approvals
 *     description: Reusable polymorphic approval gates (architecture Phase 5.16, rule #13)
 */
router.get('/:entityType/:entityId', validate(entityParams, 'params'), approvalController.listByEntity);
router.post('/', validate(requestApproval), approvalController.requestApproval);
router.post('/:id/approve', requireRole(ROLES.APPROVER), validate(idP, 'params'), validate(approveDecision), approvalController.approve);
router.post('/:id/reject', requireRole(ROLES.APPROVER), validate(idP, 'params'), validate(rejectDecision), approvalController.reject);

module.exports = router;
