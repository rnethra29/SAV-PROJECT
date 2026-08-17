'use strict';

const { Router } = require('express');
const authenticate = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validation.middleware');
const { entityParams } = require('../validators/auditLog.validator');
const { getHistory } = require('../controllers/auditLog.controller');

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   - name: AuditLog
 *     description: Immutable, polymorphic audit trail (read-only)
 */
router.get('/:entityType/:entityId', validate(entityParams, 'params'), getHistory);

module.exports = router;
