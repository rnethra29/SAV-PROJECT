'use strict';

/**
 * Top-level route mount point for the whole SAV ERP API - aggregates every
 * business module's own route aggregator, each of which is responsible for
 * its own URL prefixes. No prefixes changed by the module-based
 * reorganization: every module router below mounts at the exact same paths
 * it did when routes/index.js lived flatly under src/routes/.
 */

const { Router } = require('express');

const commercialLifecycleRoutes = require('../../../01-commercial-lifecycle/backend/routes');
const documentsApprovalsAuditRoutes = require('../documents-approvals-audit/routes');
const rbacRoutes = require('../../rbac/backend/routes/secRbac.routes');
const clientManagementRoutes = require('../../../02-site/01-client-management/backend/routes');
const vendorManagementRoutes = require('../../../02-site/02-vendor-management/backend/routes');

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'SAV ERP API is up', timestamp: new Date().toISOString() }));

// 01 - Commercial Lifecycle (RFQ -> Estimation -> Market/Actual Price -> Quotation -> Negotiation -> BOQ -> PO)
router.use(commercialLifecycleRoutes);

// Cross-cutting, shared by every module: Documents, Approvals, Audit Trail, RBAC
router.use(documentsApprovalsAuditRoutes);
router.use('/rbac', rbacRoutes);

// 02 - Site
router.use(clientManagementRoutes); // 02-site/01-client-management
router.use(vendorManagementRoutes); // 02-site/02-vendor-management

module.exports = router;
