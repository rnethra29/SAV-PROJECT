'use strict';

const clmClientRepository = require('../repositories/clmClient.repository');
const clmClientContactRepository = require('../repositories/clmClientContact.repository');
const auditService = require('../../../../shared/backend/documents-approvals-audit/services/audit.service');
const ApiError = require('../../../../shared/backend/utils/apiError');
const { transaction, query } = require('../../../../shared/backend/config/database');
const { CLM_CLIENT_TRANSITIONS, isValidTransition } = require('../../../../shared/backend/models/statusTransitions');

async function list(user, reqQuery) {
  return clmClientRepository.findAll({
    companyId: user.companyId,
    filters: { client_status: reqQuery.status, client_type_id: reqQuery.clientTypeId, industry_id: reqQuery.industryId },
    allowedSort: ['client_code', 'legal_name', 'display_name', 'client_status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const clientRow = await clmClientRepository.findById(id, { companyId: user.companyId });
  if (!clientRow) throw ApiError.notFound('Client not found');
  return clientRow;
}

/** Client master creation (architecture doc §6.3): starts life as 'Prospect' (DB default) unless overridden. */
async function create(data, user) {
  const existingCode = await clmClientRepository.findByCode(data.client_code, user.companyId);
  if (existingCode) throw ApiError.conflict(`Client code '${data.client_code}' already exists`);

  if (data.gstin) {
    const existingGstin = await clmClientRepository.findByGstin(data.gstin, user.companyId);
    if (existingGstin) throw ApiError.conflict(`GSTIN '${data.gstin}' is already registered to another client`, { code: 'UNIQUE_VIOLATION' });
  }

  return transaction(async (client) => {
    const clientRow = await clmClientRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Client', entityId: clientRow.client_id, action: 'Insert', userId: user.id, newValue: clientRow }, client);
    return clientRow;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.client_status && !isValidTransition(CLM_CLIENT_TRANSITIONS, existing.client_status, data.client_status)) {
    throw ApiError.badRequest(`Invalid client status transition: '${existing.client_status}' -> '${data.client_status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  if (data.gstin && data.gstin !== existing.gstin) {
    const existingGstin = await clmClientRepository.findByGstin(data.gstin, user.companyId);
    if (existingGstin) throw ApiError.conflict(`GSTIN '${data.gstin}' is already registered to another client`, { code: 'UNIQUE_VIOLATION' });
  }

  return transaction(async (client) => {
    const updated = await clmClientRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Client not found');
    // Client status changes are captured via com_audit_log's StatusChange action only
    // (architecture doc §17) - clm_client_status_history does not track 'Client'.
    await auditService.log(
      { entityType: 'Client', entityId: id, action: data.client_status && data.client_status !== existing.client_status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const contacts = await clmClientContactRepository.findByClientId(id);
  if (contacts.length) {
    throw ApiError.conflict('Cannot delete a client that still has contacts on record - remove them first', { code: 'HAS_DEPENDENTS' });
  }
  const dependentResult = await query(
    `SELECT
       (SELECT COUNT(*) FROM clm_client_requirement WHERE client_id = $1 AND deleted_at IS NULL) AS requirements,
       (SELECT COUNT(*) FROM clm_client_invoice WHERE client_id = $1 AND deleted_at IS NULL) AS invoices,
       (SELECT COUNT(*) FROM clm_payment WHERE client_id = $1 AND deleted_at IS NULL) AS payments`,
    [id]
  );
  const { requirements, invoices, payments } = dependentResult.rows[0];
  if (Number(requirements) || Number(invoices) || Number(payments)) {
    throw ApiError.conflict('Cannot delete a client with requirements, invoices, or payments on record', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await clmClientRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Client', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, update, remove };
