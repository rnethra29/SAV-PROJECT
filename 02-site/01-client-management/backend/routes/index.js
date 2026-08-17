'use strict';

/**
 * Route aggregator for the Site -> Client Management submodule. Mounted
 * with no extra prefix by shared/backend/routes/index.js, so every URL is
 * unchanged from before this reorg (e.g. still /api/v1/clients).
 */

const { Router } = require('express');

const clmClientRoutes = require('./clmClient.routes');
const clmClientContactRoutes = require('./clmClientContact.routes');
const clmClientRequirementRoutes = require('./clmClientRequirement.routes');
const clmClientInvoiceRoutes = require('./clmClientInvoice.routes');
const clmClientInvoiceLineRoutes = require('./clmClientInvoiceLine.routes');
const clmPaymentRoutes = require('./clmPayment.routes');
const clmLookupRoutes = require('./clmLookup.routes');

const router = Router();

router.use('/clients', clmClientRoutes);
router.use('/client-contacts', clmClientContactRoutes);
router.use('/client-requirements', clmClientRequirementRoutes);
router.use('/client-invoices', clmClientInvoiceRoutes);
router.use('/invoice-lines', clmClientInvoiceLineRoutes);
router.use('/client-payments', clmPaymentRoutes);
router.use('/client-lookups', clmLookupRoutes);

module.exports = router;
