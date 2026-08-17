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

// Sites module -> Client Management submodule (clm_*, see
// SAV_ERP_Client_Management_Module_Architecture.md)
const clmClientRoutes = require('./clmClient.routes');
const clmClientContactRoutes = require('./clmClientContact.routes');
const clmClientRequirementRoutes = require('./clmClientRequirement.routes');
const clmClientInvoiceRoutes = require('./clmClientInvoice.routes');
const clmClientInvoiceLineRoutes = require('./clmClientInvoiceLine.routes');
const clmPaymentRoutes = require('./clmPayment.routes');
const clmLookupRoutes = require('./clmLookup.routes');

// Sites module -> Vendor Management & Procurement submodule (vnd_*) + Client
// Management extension (clm_project*) + RBAC (sec_*), see
// SAV_ERP_Sites_Vendor_Procurement_Module_Architecture.md
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
const secRbacRoutes = require('./secRbac.routes');

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

// ============================================================
// Sites module -> Client Management submodule
// Client (+contacts/requirements/invoices/payments nested) -> Client 360.
// RFQ->PO chain, Documents, Approvals, Audit Log above are reused by FK /
// entity_type only (architecture doc §2) - not redefined here.
// ============================================================
router.use('/clients', clmClientRoutes);
router.use('/client-contacts', clmClientContactRoutes);
router.use('/client-requirements', clmClientRequirementRoutes);
router.use('/client-invoices', clmClientInvoiceRoutes);
router.use('/invoice-lines', clmClientInvoiceLineRoutes);
router.use('/client-payments', clmPaymentRoutes);
router.use('/client-lookups', clmLookupRoutes);

// ============================================================
// Sites module -> Vendor Management & Procurement submodule
// Project (+cost-plan/expenses nested) -> Vendor (+contacts/bank-accounts/
// materials/ratings nested) -> Procurement PO (+items) -> Vendor Invoice
// (+items) -> Vendor Payment (+allocations). "Procurement Orders" here is
// vnd_purchase_order (direct material/service procurement), distinct from
// /purchase-orders above (com_po, the subcontract/work-package PO) -
// architecture doc §0's reconciliation table explains why they stay separate.
// ============================================================
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
router.use('/rbac', secRbacRoutes);

module.exports = router;
