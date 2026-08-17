'use strict';

const clmClientInvoiceLineRepository = require('../repositories/clmClientInvoiceLine.repository');
const clmClientInvoiceRepository = require('../repositories/clmClientInvoice.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction } = require('../../../../shared/backend/config/database');

/** Invoice lines are only mutable while the header is still 'Draft' - once Submitted, a wrong line is corrected via cancellation + reissue, not an in-place edit (architecture doc §17: "never overwritten row"). */
function assertInvoiceEditable(invoice) {
  if (invoice.status !== 'Draft') {
    throw ApiError.conflict(`Invoice lines cannot be modified while invoice status is '${invoice.status}' - only 'Draft' invoices are editable`, { code: 'INVOICE_NOT_EDITABLE' });
  }
}

async function listByInvoice(invoiceId, user) {
  const invoice = await clmClientInvoiceRepository.findById(invoiceId, { companyId: user.companyId });
  if (!invoice) throw ApiError.notFound('Client invoice not found');
  return clmClientInvoiceLineRepository.findByInvoiceId(invoiceId);
}

async function getById(id, user) {
  const line = await clmClientInvoiceLineRepository.findById(id, { companyId: user.companyId });
  if (!line) throw ApiError.notFound('Invoice line not found');
  return line;
}

async function create(data, user) {
  const invoice = await clmClientInvoiceRepository.findById(data.invoice_id, { companyId: user.companyId });
  if (!invoice) throw ApiError.badRequest('invoice_id does not exist');
  assertInvoiceEditable(invoice);

  return transaction(async (client) => {
    const line = await clmClientInvoiceLineRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'ClientInvoice', entityId: data.invoice_id, action: 'Update', userId: user.id, newValue: { invoice_line_created: line } }, client);
    return line;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  const invoice = await clmClientInvoiceRepository.findById(existing.invoice_id, { companyId: user.companyId });
  assertInvoiceEditable(invoice);

  return transaction(async (client) => {
    const updated = await clmClientInvoiceLineRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Invoice line not found');
    await auditService.log({ entityType: 'ClientInvoice', entityId: existing.invoice_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const invoice = await clmClientInvoiceRepository.findById(existing.invoice_id, { companyId: user.companyId });
  assertInvoiceEditable(invoice);

  return transaction(async (client) => {
    const deleted = await clmClientInvoiceLineRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ClientInvoice', entityId: existing.invoice_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByInvoice, getById, create, update, remove, assertInvoiceEditable };
