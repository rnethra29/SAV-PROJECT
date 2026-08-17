'use strict';

/**
 * Route aggregator for the Site -> Vendor Management & Procurement
 * submodule (also owns the Project/Cost/Expense extension to Client
 * Management - see this module's README). Mounted with no extra prefix by
 * shared/backend/routes/index.js, so every URL is unchanged from before
 * this reorg (e.g. still /api/v1/procurement-orders).
 */

const { Router } = require('express');

const clmProjectRoutes = require('./clmProject.routes');
const clmProjectCostRoutes = require('./clmProjectCost.routes');
const clmProjectExpenseRoutes = require('./clmProjectExpense.routes');
const vndVendorRoutes = require('./vndVendor.routes');
const vndVendorContactRoutes = require('./vndVendorContact.routes');
const vndVendorBankAccountRoutes = require('./vndVendorBankAccount.routes');
const vndMaterialServiceRoutes = require('./vndMaterialService.routes');
const vndPurchaseOrderRoutes = require('./vndPurchaseOrder.routes');
const vndPurchaseOrderItemRoutes = require('./vndPurchaseOrderItem.routes');
const vndVendorInvoiceRoutes = require('./vndVendorInvoice.routes');
const vndVendorInvoiceItemRoutes = require('./vndVendorInvoiceItem.routes');
const vndVendorPaymentRoutes = require('./vndVendorPayment.routes');
const vndLookupRoutes = require('./vndLookup.routes');

const router = Router();

router.use('/projects', clmProjectRoutes);
router.use('/project-costs', clmProjectCostRoutes);
router.use('/project-expenses', clmProjectExpenseRoutes);
router.use('/vendors', vndVendorRoutes);
router.use('/vendor-contacts', vndVendorContactRoutes);
router.use('/vendor-bank-accounts', vndVendorBankAccountRoutes);
router.use('/vendor-materials', vndMaterialServiceRoutes);
router.use('/procurement-orders', vndPurchaseOrderRoutes);
router.use('/procurement-order-items', vndPurchaseOrderItemRoutes);
router.use('/vendor-invoices', vndVendorInvoiceRoutes);
router.use('/vendor-invoice-items', vndVendorInvoiceItemRoutes);
router.use('/vendor-payments', vndVendorPaymentRoutes);
router.use('/vendor-lookups', vndLookupRoutes);

module.exports = router;
