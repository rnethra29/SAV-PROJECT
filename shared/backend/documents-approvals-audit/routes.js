'use strict';

/**
 * Route aggregator for the shared, polymorphic Documents / Approvals /
 * Audit Log engine (com_documents / com_approvals / com_audit_log) - reused
 * by every module (Commercial Lifecycle, Client Management, Vendor
 * Management & Procurement), so it lives in shared/, not inside any one
 * module. Mounted with no extra prefix, so URLs are unchanged
 * (/api/v1/documents, /api/v1/approvals, /api/v1/audit-log).
 */

const { Router } = require('express');

const documentRoutes = require('./routes/document.routes');
const approvalRoutes = require('./routes/approval.routes');
const auditLogRoutes = require('./routes/auditLog.routes');

const router = Router();

router.use('/documents', documentRoutes);
router.use('/approvals', approvalRoutes);
router.use('/audit-log', auditLogRoutes);

module.exports = router;
