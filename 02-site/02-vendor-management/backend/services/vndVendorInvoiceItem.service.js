'use strict';

const vndVendorInvoiceItemRepository = require('../repositories/vndVendorInvoiceItem.repository');
const vndVendorInvoiceRepository = require('../repositories/vndVendorInvoice.repository');
const vndPurchaseOrderItemRepository = require('../repositories/vndPurchaseOrderItem.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction } = require('../../../../shared/backend/config/database');

/** Invoice lines are only mutable while the header is still 'Draft' - same convention as clm_client_invoice_line. */
function assertInvoiceEditable(invoice) {
  if (invoice.status !== 'Draft') {
    throw ApiError.conflict(`Vendor invoice lines cannot be modified while invoice status is '${invoice.status}' - only 'Draft' invoices are editable`, { code: 'INVOICE_NOT_EDITABLE' });
  }
}

async function listByInvoice(invoiceId, user) {
  const invoice = await vndVendorInvoiceRepository.findById(invoiceId, { companyId: user.companyId });
  if (!invoice) throw ApiError.notFound('Vendor invoice not found');
  return vndVendorInvoiceItemRepository.findByInvoiceId(invoiceId);
}

async function getById(id, user) {
  const line = await vndVendorInvoiceItemRepository.findById(id);
  if (!line) throw ApiError.notFound('Vendor invoice line not found');
  // No company_id column on this bare child row (doc §6.14) - authorize via its parent invoice instead.
  await vndVendorInvoiceRepository.findById(line.vendor_invoice_id, { companyId: user.companyId }).then((inv) => {
    if (!inv) throw ApiError.notFound('Vendor invoice line not found');
  });
  return line;
}

/** No company_id/branch_id/audit columns to stamp (doc §6.14) - only the reconciliation link to po_item_id, if any, is validated. */
async function create(data, user) {
  const invoice = await vndVendorInvoiceRepository.findById(data.vendor_invoice_id, { companyId: user.companyId });
  if (!invoice) throw ApiError.badRequest('vendor_invoice_id does not exist');
  assertInvoiceEditable(invoice);

  if (data.po_item_id) {
    const poItem = await vndPurchaseOrderItemRepository.findById(data.po_item_id, { companyId: user.companyId });
    if (!poItem) throw ApiError.badRequest('po_item_id does not exist');
  }

  return transaction(async (client) => {
    const line = await vndVendorInvoiceItemRepository.create(data, { client });
    await auditService.log({ entityType: 'VendorInvoice', entityId: data.vendor_invoice_id, action: 'Update', userId: user.id, newValue: { invoice_line_created: line } }, client);
    return line;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  const invoice = await vndVendorInvoiceRepository.findById(existing.vendor_invoice_id, { companyId: user.companyId });
  assertInvoiceEditable(invoice);

  return transaction(async (client) => {
    const updated = await vndVendorInvoiceItemRepository.update(id, data, { client });
    if (!updated) throw ApiError.notFound('Vendor invoice line not found');
    await auditService.log({ entityType: 'VendorInvoice', entityId: existing.vendor_invoice_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const invoice = await vndVendorInvoiceRepository.findById(existing.vendor_invoice_id, { companyId: user.companyId });
  assertInvoiceEditable(invoice);

  return transaction(async (client) => {
    const deleted = await vndVendorInvoiceItemRepository.remove(id, { client });
    await auditService.log({ entityType: 'VendorInvoice', entityId: existing.vendor_invoice_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByInvoice, getById, create, update, remove };
