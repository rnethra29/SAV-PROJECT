'use strict';

const vndVendorInvoiceRepository = require('../repositories/vndVendorInvoice.repository');
const vndVendorInvoiceItemRepository = require('../repositories/vndVendorInvoiceItem.repository');
const vndVendorPaymentAllocationRepository = require('../repositories/vndVendorPaymentAllocation.repository');
const vndVendorRepository = require('../repositories/vndVendor.repository');
const vndPurchaseOrderRepository = require('../repositories/vndPurchaseOrder.repository');
const clmProjectRepository = require('../repositories/clmProject.repository');
const approvalService = require('./approval.service');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');
const { VND_INVOICE_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');
const { APPROVAL_STAGES } = require('../models/approvalStages');

async function list(user, reqQuery) {
  return vndVendorInvoiceRepository.findAll({
    companyId: user.companyId,
    filters: { vendor_id: reqQuery.vendorId, project_id: reqQuery.projectId, purchase_order_id: reqQuery.purchaseOrderId, status: reqQuery.status },
    allowedSort: ['invoice_number', 'invoice_date', 'due_date', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const invoice = await vndVendorInvoiceRepository.findById(id, { companyId: user.companyId });
  if (!invoice) throw ApiError.notFound('Vendor invoice not found');
  return invoice;
}

/** total_amount is a same-row GENERATED column (subtotal + tax, doc §6.13) - never accepted from the request body; the validator already omits it. */
async function create(data, user) {
  const vendor = await vndVendorRepository.findById(data.vendor_id, { companyId: user.companyId });
  if (!vendor) throw ApiError.badRequest('vendor_id does not exist');
  const project = await clmProjectRepository.findById(data.project_id, { companyId: user.companyId });
  if (!project) throw ApiError.badRequest('project_id does not exist');
  if (data.purchase_order_id) {
    const po = await vndPurchaseOrderRepository.findById(data.purchase_order_id, { companyId: user.companyId });
    if (!po) throw ApiError.badRequest('purchase_order_id does not exist');
  }

  // invoice_number is UNIQUE(vendor_id, invoice_number) - not globally unique (doc §6.13).
  const existing = await vndVendorInvoiceRepository.findByVendorAndNumber(data.vendor_id, data.invoice_number, user.companyId);
  if (existing) throw ApiError.conflict(`Invoice number '${data.invoice_number}' already exists for this vendor`, { code: 'UNIQUE_VIOLATION' });

  return transaction(async (client) => {
    const invoice = await vndVendorInvoiceRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'VendorInvoice', entityId: invoice.vendor_invoice_id, action: 'Insert', userId: user.id, newValue: invoice }, client);
    return invoice;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.status && !isValidTransition(VND_INVOICE_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid vendor invoice status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }
  if (data.status === 'Approved' && !(await approvalService.isApproved('VendorInvoice', id, APPROVAL_STAGES.VENDOR_INVOICE))) {
    throw ApiError.conflict(`Invoice cannot be marked 'Approved' without an Approved '${APPROVAL_STAGES.VENDOR_INVOICE}' record`, { code: 'APPROVAL_REQUIRED' });
  }

  return transaction(async (client) => {
    const updated = await vndVendorInvoiceRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Vendor invoice not found');
    await auditService.log(
      { entityType: 'VendorInvoice', entityId: id, action: data.status && data.status !== existing.status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

/** Single, mandatory checkpoint before any approval stage (doc §13: "required invoice verification" validation) - modeled as columns, not a com_approvals row, since it's a fixed single check, not a configurable chain. */
async function verify(id, user) {
  const existing = await getById(id, user);
  if (!isValidTransition(VND_INVOICE_TRANSITIONS, existing.status, 'Verified')) {
    throw ApiError.badRequest(`Invalid vendor invoice status transition: '${existing.status}' -> 'Verified'`, { code: 'INVALID_STATUS_TRANSITION' });
  }
  return transaction(async (client) => {
    const updated = await vndVendorInvoiceRepository.update(
      id,
      { status: 'Verified', verified_by: user.id, verified_at: new Date() },
      { companyId: user.companyId, userId: user.id, client }
    );
    await auditService.log({ entityType: 'VendorInvoice', entityId: id, action: 'StatusChange', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const items = await vndVendorInvoiceItemRepository.findByInvoiceId(id);
  if (items.length) throw ApiError.conflict('Cannot delete an invoice that still has line items - remove them first', { code: 'HAS_DEPENDENTS' });

  const allocations = await vndVendorPaymentAllocationRepository.findByInvoiceId(id);
  if (allocations.length) throw ApiError.conflict('Cannot delete an invoice that already has payment allocations against it', { code: 'HAS_DEPENDENTS' });

  return transaction(async (client) => {
    const deleted = await vndVendorInvoiceRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'VendorInvoice', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, update, verify, remove };
