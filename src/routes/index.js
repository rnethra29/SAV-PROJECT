'use strict';

const { Router } = require('express');

const rfqRoutes = require('./rfq.routes');
const rfqItemRoutes = require('./rfqItem.routes');
const priceRoutes = require('./price.routes'); // market price + actual price, nested under /rfq-items/:rfqItemId/...
const estimationRoutes = require('./estimation.routes');
const estimationItemRoutes = require('./estimationItem.routes');
const quotationRoutes = require('./quotation.routes');
const quotationItemRoutes = require('./quotationItem.routes');
const negotiationRoutes = require('./negotiation.routes');
const boqRoutes = require('./boq.routes');
const boqItemRoutes = require('./boqItem.routes');
const poRoutes = require('./po.routes');
const poItemRoutes = require('./poItem.routes');
const documentRoutes = require('./document.routes');
const approvalRoutes = require('./approval.routes');
const auditLogRoutes = require('./auditLog.routes');
const lookupRoutes = require('./lookup.routes');
const analysisRoutes = require('./analysis.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'Commercial Lifecycle module API is up', timestamp: new Date().toISOString() }));

// RFQ -> Estimation -> Market/Actual Price -> Quotation -> Negotiation -> BOQ -> PO
// (architecture Phase 3 module flow)
router.use('/rfqs', rfqRoutes);
router.use('/rfq-items', rfqItemRoutes);
router.use('/rfq-items', priceRoutes); // adds /rfq-items/:rfqItemId/market-prices, /actual-price[/history]
router.use('/estimations', estimationRoutes);
router.use('/estimation-items', estimationItemRoutes);
router.use('/quotations', quotationRoutes);
router.use('/quotation-items', quotationItemRoutes);
router.use('/negotiation-offers', negotiationRoutes);
router.use('/boqs', boqRoutes);
router.use('/boq-items', boqItemRoutes);
router.use('/purchase-orders', poRoutes);
router.use('/po-items', poItemRoutes);

// Cross-cutting: Documents, Approvals, Audit Trail, Analysis (architecture Phase 3 "cross-cutting" band)
router.use('/documents', documentRoutes);
router.use('/approvals', approvalRoutes);
router.use('/audit-log', auditLogRoutes);
router.use('/analysis', analysisRoutes);

// Lookups
router.use('/lookups', lookupRoutes);

module.exports = router;
