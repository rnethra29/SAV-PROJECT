'use strict';

const poRepository = require('./po.repository');
const poItemRepository = require('./poItem.repository');
const boqRepository = require('../boq/boq.repository');
const boqItemRepository = require('../boq/boqItem.repository');
const auditService = require('../../../shared/backend/documents-approvals-audit/services/audit.service');
const approvalService = require('../../../shared/backend/documents-approvals-audit/services/approval.service');
const ApiError = require('../../../shared/backend/utils/apiError');
const { transaction } = require('../../../shared/backend/config/database');
const { PO_TRANSITIONS, isValidTransition } = require('../../../shared/backend/models/statusTransitions');
const { APPROVAL_STAGES } = require('../../../shared/backend/models/approvalStages');

async function list(user, reqQuery) {
  return poRepository.findAll({
    companyId: user.companyId,
    filters: { boq_id: reqQuery.boqId, vendor_id: reqQuery.vendorId, status: reqQuery.status },
    allowedSort: ['po_number', 'status', 'created_at'],
    defaultSort: 'created_at',
    pagination: reqQuery,
  });
}

async function getById(id, user) {
  const po = await poRepository.findById(id, { companyId: user.companyId });
  if (!po) throw ApiError.notFound('PO not found');
  return po;
}

async function create(data, user) {
  const existing = await poRepository.findByNumber(data.po_number, user.companyId);
  if (existing) throw ApiError.conflict(`PO number '${data.po_number}' already exists`);

  return transaction(async (client) => {
    const po = await poRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'PO', entityId: po.po_id, action: 'Insert', userId: user.id, newValue: po }, client);
    return po;
  });
}

/** Architecture Phase 2 step 11 / Phase 5.13: "once BOQ is Final, PO is raised against it". Requires the BOQ to be Final; rate defaults to the BOQ item's unit_rate but is independently stored per PO item and may be overridden per line. */
async function generateFromBoq(data, user) {
  const boq = await boqRepository.findById(data.boq_id, { companyId: user.companyId });
  if (!boq) throw ApiError.badRequest('boq_id does not exist');
  if (boq.boq_type !== 'Final' || boq.status !== 'Final') {
    throw ApiError.conflict('PO can only be generated from a Final BOQ (boq_type=Final, status=Final)', { code: 'BOQ_NOT_FINAL' });
  }

  const existing = await poRepository.findByNumber(data.po_number, user.companyId);
  if (existing) throw ApiError.conflict(`PO number '${data.po_number}' already exists`);

  if (!data.items || !data.items.length) throw ApiError.badRequest('items array must contain at least one PO line item');

  return transaction(async (client) => {
    const po = await poRepository.create(
      {
        po_number: data.po_number,
        po_date: data.po_date,
        vendor_id: data.vendor_id,
        project_id: boq.project_id,
        site_id: boq.site_id,
        boq_id: boq.boq_id,
        quotation_id: boq.quotation_id,
        rfq_id: boq.rfq_id,
        payment_terms: data.payment_terms || null,
        delivery_timeline: data.delivery_timeline || null,
        terms_and_conditions: data.terms_and_conditions || null,
        status: 'Draft',
        remarks: data.remarks || null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );

    const createdItems = [];
    let seq = 1;
    for (const line of data.items) {
      const boqItem = await boqItemRepository.findById(line.boq_item_id, { companyId: user.companyId, client });
      if (!boqItem) throw ApiError.badRequest(`boq_item_id ${line.boq_item_id} does not exist`);
      if (boqItem.boq_id !== boq.boq_id) throw ApiError.badRequest(`boq_item_id ${line.boq_item_id} does not belong to boq_id ${boq.boq_id}`);

      const item = await poItemRepository.create(
        {
          po_id: po.po_id,
          boq_item_id: boqItem.boq_item_id,
          description: boqItem.description,
          unit: boqItem.unit,
          quantity: line.quantity ?? boqItem.quantity,
          rate: line.rate ?? boqItem.unit_rate,
          tax_percentage: line.tax_percentage ?? 0,
          sequence_no: line.sequence_no ?? seq++,
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

    await poRepository.recomputeTotals(po.po_id, client);
    await auditService.log({ entityType: 'PO', entityId: po.po_id, action: 'Insert', userId: user.id, newValue: { po, item_count: createdItems.length } }, client);

    return { po: await poRepository.findById(po.po_id, { client }), items: createdItems };
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  if (data.status && !isValidTransition(PO_TRANSITIONS, existing.status, data.status)) {
    throw ApiError.badRequest(`Invalid PO status transition: '${existing.status}' -> '${data.status}'`, { code: 'INVALID_STATUS_TRANSITION' });
  }

  if (data.status === 'Approved' && !(await approvalService.isApproved('PO', id, APPROVAL_STAGES.PO))) {
    throw ApiError.conflict(`PO cannot be marked 'Approved' without an Approved '${APPROVAL_STAGES.PO}' record`, { code: 'APPROVAL_REQUIRED' });
  }

  return transaction(async (client) => {
    const updated = await poRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('PO not found');
    await auditService.log(
      { entityType: 'PO', entityId: id, action: data.status && data.status !== existing.status ? 'StatusChange' : 'Update', userId: user.id, oldValue: existing, newValue: updated },
      client
    );
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  return transaction(async (client) => {
    const deleted = await poRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'PO', entityId: id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { list, getById, create, generateFromBoq, update, remove };
