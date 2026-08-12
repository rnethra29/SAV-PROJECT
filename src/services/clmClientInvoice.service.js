'use strict';

const clmClientInvoiceRepository = require('../repositories/clmClientInvoice.repository');
const clmClientInvoiceLineRepository = require('../repositories/clmClientInvoiceLine.repository');
const clmPaymentAllocationRepository = require('../repositories/clmPaymentAllocation.repository');
const clmClientRepository = require('../repositories/clmClient.repository');
const clmClientStatusHistoryRepository = require('../repositories/clmClientStatusHistory.repository');
const auditService = require('./audit.service');
const approvalService = require('./approval.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');
const { CLM_INVOICE_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');
const { APPROVAL_STAGES } = require('../models/approvalStages');

async function list(user, reqQuery) {
  return clmClientInvoiceRepository.findAll({
    companyId: user.companyId,
    filters: { client_id: reqQuery.clientId, project_id: reqQuery.projectId, po_id: reqQuery.poId, status: reqQuery.status },
    allowedSort: ['invoice_number', 'invoice_date', 'due_date', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function listByClient(clientId, user, reqQuery) {
  const clientRow = await clmClientRepository.findById(clientId, { companyId: user.companyId });
  if (!clientRow) throw ApiError.notFound('Client not found');
  return list(user, { ...reqQuery, clientId });
}

async function getById(id, user) {
  const invoice = await clmClientInvoiceRepository.findById(id, { companyId: user.companyId });
  if (!invoice) throw ApiError.notFound('Client invoice not found');
  return invoice;
}

/** `net_amount` is a same-row GENERATED column (doc §6.7 design note) - never accepted from the request body; the validator already omits it. */
async function create(data, user) {
  const clientRow = await clmClientRepository.findById(data.client_id, { companyId: user.companyId });
  if (!clientRow) throw ApiError.badRequest('client_id does not exist');

  const existing = await clmClientInvoiceRepository.findByNumber(data.invoice_number, user.companyId);
  if (existing) throw ApiError.conflict(`Invoice number '${data.invoice_number}' already exists`);

  return transaction(async (client) => {
    const invoice = await clmClientInvoiceRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'ClientInvoice', entityId: invoice.invoice_id, action: 'Insert', userId: user.id, newValue: invoice }, client);
    return invoice;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.status && !isValidTransition(CLM_INVOICE_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid invoice status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  // Architecture doc §15 Security: "only Approver roles can transition
  // clm_client_invoice.status from Submitted -> Approved" - gated the same
  // way RFQ/BOQ/PO gate their own approval-dependent transitions.
  if (data.status === 'Approved' && !(await approvalService.isApproved('ClientInvoice', id, APPROVAL_STAGES.CLIENT_INVOICE))) {
    throw ApiError.conflict(`Invoice cannot be marked 'Approved' without an Approved '${APPROVAL_STAGES.CLIENT_INVOICE}' record`, { code: 'APPROVAL_REQUIRED' });
  }

  return transaction(async (client) => {
    const updated = await clmClientInvoiceRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Client invoice not found');

    const statusChanged = data.status && data.status !== existing.status;
    if (statusChanged) {
      await clmClientStatusHistoryRepository.record(
        { entity_type: 'ClientInvoice', entity_id: id, old_status: existing.status, new_status: data.status, changed_by: user.id, remarks: data.statusChangeRemarks },
        client
      );
    }
    await auditService.log(
      { entityType: 'ClientInvoice', entityId: id, action: statusChanged ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const lines = await clmClientInvoiceLineRepository.findByInvoiceId(id);
  if (lines.length) throw ApiError.conflict('Cannot delete an invoice that still has line items - remove them first', { code: 'HAS_DEPENDENTS' });

  const allocations = await clmPaymentAllocationRepository.findByInvoiceId(id);
  if (allocations.length) throw ApiError.conflict('Cannot delete an invoice that already has payment allocations against it', { code: 'HAS_DEPENDENTS' });

  return transaction(async (client) => {
    const deleted = await clmClientInvoiceRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'ClientInvoice', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, listByClient, getById, create, update, remove };
