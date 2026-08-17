'use strict';

const boqRepository = require('./boq.repository');
const boqItemRepository = require('./boqItem.repository');
const rfqRepository = require('../rfq/rfq.repository');
const quotationRepository = require('../quotation/quotation.repository');
const rfqItemRepository = require('../rfq/rfqItem.repository');
const auditService = require('../../../shared/backend/documents-approvals-audit/services/audit.service');
const approvalService = require('../../../shared/backend/documents-approvals-audit/services/approval.service');
const ApiError = require('../../../shared/backend/utils/apiError');
const { transaction, query } = require('../../../shared/backend/config/database');
const { wordCount } = require('../../../shared/backend/utils/helpers');
const { BOQ_TRANSITIONS, isValidTransition } = require('../../../shared/backend/models/statusTransitions');
const { APPROVAL_STAGES } = require('../../../shared/backend/models/approvalStages');
const { resolveUnitRate } = require('./boqItem.service');

async function list(user, reqQuery) {
  return boqRepository.findAll({
    companyId: user.companyId,
    filters: { rfq_id: reqQuery.rfqId, quotation_id: reqQuery.quotationId, boq_type: reqQuery.boqType, status: reqQuery.status },
    allowedSort: ['boq_number', 'version_no', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const boq = await boqRepository.findById(id, { companyId: user.companyId });
  if (!boq) throw ApiError.notFound('BOQ not found');
  return boq;
}

async function getVersions(boqNumber, user) {
  return boqRepository.findVersionsByNumber(boqNumber, user.companyId);
}

async function create(data, user) {
  const rfq = await rfqRepository.findById(data.rfq_id, { companyId: user.companyId });
  if (!rfq) throw ApiError.badRequest('rfq_id does not exist');
  if (data.quotation_id) {
    const quotation = await quotationRepository.findById(data.quotation_id, { companyId: user.companyId });
    if (!quotation) throw ApiError.badRequest('quotation_id does not exist');
  }

  const existingVersions = await boqRepository.findVersionsByNumber(data.boq_number, user.companyId);
  if (existingVersions.length) {
    throw ApiError.conflict(`BOQ number '${data.boq_number}' already exists - use the "new version" endpoint instead`, { code: 'UNIQUE_VIOLATION' });
  }

  return transaction(async (client) => {
    const boq = await boqRepository.create(
      { ...data, version_no: 1, previous_version_id: null, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'BOQ', entityId: boq.boq_id, action: 'Insert', userId: user.id, newValue: boq }, client);
    return boq;
  });
}

/**
 * Generates a Tentative BOQ header + items in one shot from a settled
 * quotation (architecture Phase 2 step 10 / Phase 14 "Tentative BOQ" row).
 * `items` supplies the one field that is always human-authored - the
 * <=50-word `description` - plus placement (item_code/sequence_no/
 * parent placeholder handled client-side via item_code ordering);
 * `unit_rate` is snapshotted from the latest settled negotiation offer
 * (falling back to the quotation's `quoted_rate`) unless overridden.
 */
async function generateTentativeFromQuotation(data, user) {
  const rfq = await rfqRepository.findById(data.rfq_id, { companyId: user.companyId });
  if (!rfq) throw ApiError.badRequest('rfq_id does not exist');
  const quotation = await quotationRepository.findById(data.quotation_id, { companyId: user.companyId });
  if (!quotation) throw ApiError.badRequest('quotation_id does not exist');
  if (quotation.rfq_id !== data.rfq_id) throw ApiError.badRequest('quotation_id must belong to the given rfq_id');

  const existingVersions = await boqRepository.findVersionsByNumber(data.boq_number, user.companyId);
  if (existingVersions.length) {
    throw ApiError.conflict(`BOQ number '${data.boq_number}' already exists`, { code: 'UNIQUE_VIOLATION' });
  }

  if (!data.items || !data.items.length) throw ApiError.badRequest('items array must contain at least one BOQ line item');

  return transaction(async (client) => {
    const boq = await boqRepository.create(
      {
        boq_number: data.boq_number,
        version_no: 1,
        previous_version_id: null,
        boq_title: data.boq_title,
        project_id: data.project_id,
        client_id: data.client_id,
        site_id: data.site_id || null,
        rfq_id: data.rfq_id,
        quotation_id: data.quotation_id,
        boq_type: 'Tentative',
        status: 'Tentative',
        remarks: data.remarks || null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );

    const createdItems = [];
    for (const line of data.items) {
      const rfqItem = await rfqItemRepository.findById(line.rfq_item_id, { companyId: user.companyId, client });
      if (!rfqItem) throw ApiError.badRequest(`rfq_item_id ${line.rfq_item_id} does not exist`);

      const words = wordCount(line.description);
      if (words < 1 || words > 50) throw ApiError.badRequest(`BOQ description for item_code '${rfqItem.item_code}' must be 1-50 words (got ${words})`, { code: 'DESCRIPTION_WORD_COUNT' });

      let unitRate = line.unit_rate;
      let sourceQuotationItemId = null;
      if (unitRate === undefined || unitRate === null) {
        const resolved = await resolveUnitRate(line.rfq_item_id, data.quotation_id);
        if (resolved.rate === null) throw ApiError.badRequest(`No quotation item found for rfq_item_id ${line.rfq_item_id} under quotation ${data.quotation_id}`);
        unitRate = resolved.rate;
        sourceQuotationItemId = resolved.quotationItem.quotation_item_id;
      }

      const item = await boqItemRepository.create(
        {
          boq_id: boq.boq_id,
          parent_item_id: line.parent_item_id || null,
          category_id: line.category_id || rfqItem.category_id || null,
          item_code: rfqItem.item_code,
          description: line.description,
          description_word_count: words,
          unit: rfqItem.unit,
          quantity: rfqItem.quantity,
          unit_rate: unitRate,
          sequence_no: line.sequence_no,
          source_rfq_item_id: line.rfq_item_id,
          source_quotation_item_id: sourceQuotationItemId,
          remarks: line.remarks || null,
          company_id: user.companyId,
          branch_id: user.branchId,
          created_by: user.id,
          updated_by: user.id,
        },
        { client }
      );
      createdItems.push(item);
    }

    await auditService.log({ entityType: 'BOQ', entityId: boq.boq_id, action: 'Insert', userId: user.id, newValue: { boq, item_count: createdItems.length } }, client);

    return { boq, items: createdItems };
  });
}

/** New BOQ version - Tentative -> Final progression, or any later revision (architecture Phase 8 rule #6). `revision_reason` is mandatory (DB CHECK). */
async function createNewVersion(previousId, data, user, { cloneItems = true } = {}) {
  const previous = await getById(previousId, user);
  if (await boqRepository.hasNewerVersion(previousId)) {
    throw ApiError.conflict('This BOQ version already has a newer version - operate on the latest version instead', { code: 'STALE_VERSION' });
  }
  if (!data.revision_reason) throw ApiError.badRequest('revision_reason is required when creating a new BOQ version');

  return transaction(async (client) => {
    const newVersion = await boqRepository.create(
      {
        boq_number: previous.boq_number,
        version_no: previous.version_no + 1,
        previous_version_id: previous.boq_id,
        boq_title: data.boq_title || previous.boq_title,
        project_id: previous.project_id,
        client_id: previous.client_id,
        site_id: previous.site_id,
        rfq_id: previous.rfq_id,
        quotation_id: previous.quotation_id,
        boq_type: data.boq_type || previous.boq_type,
        status: data.status || 'Draft',
        revision_reason: data.revision_reason,
        remarks: data.remarks ?? previous.remarks,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );

    if (cloneItems) {
      const previousItems = await boqItemRepository.findByBoqId(previous.boq_id, { client });
      const idMap = new Map();
      for (const item of previousItems) {
        const clone = await boqItemRepository.create(
          {
            boq_id: newVersion.boq_id,
            parent_item_id: item.parent_item_id ? idMap.get(item.parent_item_id) || null : null,
            category_id: item.category_id,
            item_code: item.item_code,
            description: item.description,
            description_word_count: item.description_word_count,
            unit: item.unit,
            quantity: item.quantity,
            unit_rate: item.unit_rate,
            sequence_no: item.sequence_no,
            source_rfq_item_id: item.source_rfq_item_id,
            source_quotation_item_id: item.source_quotation_item_id,
            remarks: item.remarks,
            company_id: user.companyId,
            branch_id: user.branchId,
            created_by: user.id,
            updated_by: user.id,
          },
          { client }
        );
        idMap.set(item.boq_item_id, clone.boq_item_id);
      }
    }

    await auditService.log(
      { entityType: 'BOQ', entityId: newVersion.boq_id, action: 'Insert', userId: user.id, oldValue: { previous_version: previous.boq_id }, newValue: newVersion },
      client
    );

    return newVersion;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  if (data.status && !isValidTransition(BOQ_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid BOQ status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  if (data.status === 'Final' && !(await approvalService.isApproved('BOQ', id, APPROVAL_STAGES.BOQ))) {
    throw ApiError.conflict(`BOQ cannot be marked 'Final' without an Approved '${APPROVAL_STAGES.BOQ}' record`, { code: 'APPROVAL_REQUIRED' });
  }

  return transaction(async (client) => {
    const updated = await boqRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('BOQ not found');
    await auditService.log(
      { entityType: 'BOQ', entityId: id, action: data.status && data.status !== existing.status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  if (await boqRepository.hasNewerVersion(id)) {
    throw ApiError.conflict('Cannot delete a BOQ version that has a newer version pointing back to it', { code: 'HAS_DEPENDENTS' });
  }
  const poResult = await query(`SELECT 1 FROM com_po WHERE boq_id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
  if (poResult.rowCount > 0) throw ApiError.conflict('Cannot delete a BOQ already referenced by a PO', { code: 'HAS_DEPENDENTS' });

  return transaction(async (client) => {
    const deleted = await boqRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'BOQ', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, getVersions, create, generateTentativeFromQuotation, createNewVersion, update, remove };
