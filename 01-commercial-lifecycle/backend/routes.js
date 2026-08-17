'use strict';

/**
 * Route aggregator for the Commercial Lifecycle module: RFQ -> Estimation ->
 * Market/Actual Price -> Quotation -> Negotiation -> BOQ -> PO, plus its own
 * Lookups and Analysis views. Mounted with no extra prefix by
 * shared/backend/routes/index.js, so every URL is byte-for-byte identical to
 * before this reorg (e.g. still /api/v1/rfqs, /api/v1/purchase-orders, ...).
 */

const { Router } = require('express');

const rfqRoutes = require('./rfq/rfq.routes');
const rfqItemRoutes = require('./rfq/rfqItem.routes');
const priceRoutes = require('./market-price/price.routes'); // market price + actual price, nested under /rfq-items/:rfqItemId/...
const estimationRoutes = require('./estimation/estimation.routes');
const estimationItemRoutes = require('./estimation/estimationItem.routes');
const quotationRoutes = require('./quotation/quotation.routes');
const quotationItemRoutes = require('./quotation/quotationItem.routes');
const negotiationRoutes = require('./negotiation/negotiation.routes');
const boqRoutes = require('./boq/boq.routes');
const boqItemRoutes = require('./boq/boqItem.routes');
const poRoutes = require('./po/po.routes');
const poItemRoutes = require('./po/poItem.routes');
const analysisRoutes = require('./analysis/analysis.routes');
const lookupRoutes = require('./lookup/lookup.routes');

const router = Router();

// RFQ -> Estimation -> Market/Actual Price -> Quotation -> Negotiation -> BOQ -> PO
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

// Analysis (derived views) + this module's own Lookups
router.use('/analysis', analysisRoutes);
router.use('/lookups', lookupRoutes);

module.exports = router;
