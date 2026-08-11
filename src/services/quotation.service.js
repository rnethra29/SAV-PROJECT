'use strict';

const quotationRepository = require('../repositories/quotation.repository');
const quotationItemRepository = require('../repositories/quotationItem.repository');
const rfqRepository = require('../repositories/rfq.repository');
const auditService = require('./audit.service');
const approvalService = require('./approval.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');
const { QUOTATION_TRANSITIONS, isValidTransition } = require('../models/statusTransitions');
const { APPROVAL_STAGES } = require('../models/approvalStages');

async function list(user, reqQuery) {
  return quotationRepository.findAll({
    companyId: user.companyId,
    filters: { rfq_id: reqQuery.rfqId, status: reqQuery.status, quotation_number: reqQuery.quotationNumber },
    allowedSort: ['quotation_number', 'version_no', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const quotation = await quotationRepository.findById(id, { companyId: user.companyId });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return quotation;
}

async function getVersions(quotationNumber, user) {
  return quotationRepository.findVersionsByNumber(quotationNumber, user.companyId);
}

/** Creates version 1 of a brand-new quotation (architecture Phase 5.8/8 rule #5). */
async function create(data, user) {
  const rfq = await rfqRepository.findById(data.rfq_id, { companyId: user.companyId });
  if (!rfq) throw ApiError.badRequest('rfq_id does not exist');

  const existingVersions = await quotationRepository.findVersionsByNumber(data.quotation_number, user.companyId);
  if (existingVersions.length) {
    throw ApiError.conflict(
      `Quotation number '${data.quotation_number}' already exists (${existingVersions.length} version(s)) - use the "new version" endpoint instead of creating a duplicate v1`,
      { code: 'UNIQUE_VIOLATION' }
    );
  }

  return transaction(async (client) => {
    const quotation = await quotationRepository.create(
      {
        ...data,
        version_no: 1,
        previous_version_id: null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );
    await auditService.log({ entityType: 'Quotation', entityId: quotation.quotation_id, action: 'Insert', userId: user.id, newValue: quotation }, client);
    return quotation;
  });
}

/**
 * Creates a new version of an existing quotation (architecture Phase 8 rule
 * #5: "a new commercial position is always a new com_quotation row" -
 * nothing is ever overwritten). Optionally clones the previous version's
 * items as a starting point (`cloneItems`, default true).
 */
async function createNewVersion(previousId, data, user, { cloneItems = true } = {}) {
  const previous = await getById(previousId, user);

  if (await quotationRepository.hasNewerVersion(previousId)) {
    throw ApiError.conflict('This quotation version already has a newer version - operate on the latest version instead', { code: 'STALE_VERSION' });
  }

  return transaction(async (client) => {
    const newVersion = await quotationRepository.create(
      {
        rfq_id: previous.rfq_id,
        project_id: previous.project_id,
        client_id: previous.client_id,
        quotation_number: previous.quotation_number,
        version_no: previous.version_no + 1,
        previous_version_id: previous.quotation_id,
        quotation_date: data.quotation_date || previous.quotation_date,
        validity_date: data.validity_date ?? previous.validity_date,
        status: 'Draft',
        payment_terms: data.payment_terms ?? previous.payment_terms,
        execution_period: data.execution_period ?? previous.execution_period,
        inclusions: data.inclusions ?? previous.inclusions,
        exclusions: data.exclusions ?? previous.exclusions,
        commercial_terms: data.commercial_terms ?? previous.commercial_terms,
        remarks: data.remarks ?? null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );

    if (cloneItems) {
      const previousItems = await quotationItemRepository.findByQuotationId(previous.quotation_id, { client });
      for (const item of previousItems) {
        await quotationItemRepository.create(
          {
            quotation_id: newVersion.quotation_id,
            rfq_item_id: item.rfq_item_id,
            estimation_item_id: item.estimation_item_id,
            item_code: item.item_code,
            quantity: item.quantity,
            unit: item.unit,
            quoted_rate: item.quoted_rate,
            tax_percentage: item.tax_percentage,
            remarks: item.remarks,
            company_id: user.companyId,
            branch_id: user.branchId,
            created_by: user.id,
            updated_by: user.id,
          },
          { client }
        );
      }
      await quotationRepository.recomputeTotals(newVersion.quotation_id, client);
    }

    await auditService.log(
      { entityType: 'Quotation', entityId: newVersion.quotation_id, action: 'Insert', userId: user.id, oldValue: { previous_version: previous.quotation_id }, newValue: newVersion },
      client
    );

    return quotationRepository.findById(newVersion.quotation_id, { client });
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.status && !isValidTransition(QUOTATION_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid Quotation status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  if (data.status === 'Approved' && !(await approvalService.isApproved('Quotation', id, APPROVAL_STAGES.QUOTATION))) {
    throw ApiError.conflict(`Quotation cannot be marked 'Approved' without an Approved '${APPROVAL_STAGES.QUOTATION}' record`, { code: 'APPROVAL_REQUIRED' });
  }

  return transaction(async (client) => {
    const updated = await quotationRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Quotation not found');
    await auditService.log(
      { entityType: 'Quotation', entityId: id, action: data.status && data.status !== existing.status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  if (await quotationRepository.hasNewerVersion(id)) {
    throw ApiError.conflict('Cannot delete a quotation version that has a newer version pointing back to it', { code: 'HAS_DEPENDENTS' });
  }
  const boqResult = await query(`SELECT 1 FROM com_boq WHERE quotation_id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
  if (boqResult.rowCount > 0) {
    throw ApiError.conflict('Cannot delete a quotation already referenced by a BOQ', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await quotationRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Quotation', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, getVersions, create, createNewVersion, update, remove };
