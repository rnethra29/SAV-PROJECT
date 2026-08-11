'use strict';

const poItemRepository = require('../repositories/poItem.repository');
const poRepository = require('../repositories/po.repository');
const boqItemRepository = require('../repositories/boqItem.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

function assertPoEditable(po) {
  if (!['Draft', 'Under Approval'].includes(po.status)) {
    throw ApiError.conflict(`PO items cannot be modified while status is '${po.status}'`, { code: 'PO_NOT_EDITABLE' });
  }
}

async function listByPo(poId, user) {
  const po = await poRepository.findById(poId, { companyId: user.companyId });
  if (!po) throw ApiError.notFound('PO not found');
  return poItemRepository.findByPoId(poId);
}

async function getById(id, user) {
  const item = await poItemRepository.findById(id, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('PO item not found');
  return item;
}

/** `rate` is always independently entered/confirmed (architecture Phase 5.14: "Independent PO rate - may differ from BOQ rate"), even when defaulted from the BOQ item at creation time. */
async function create(data, user) {
  const po = await poRepository.findById(data.po_id, { companyId: user.companyId });
  if (!po) throw ApiError.badRequest('po_id does not exist');
  assertPoEditable(po);

  let description = data.description;
  let unit = data.unit;
  let rate = data.rate;

  if (data.boq_item_id) {
    const boqItem = await boqItemRepository.findById(data.boq_item_id, { companyId: user.companyId });
    if (!boqItem) throw ApiError.badRequest('boq_item_id does not exist');
    description = description ?? boqItem.description;
    unit = unit ?? boqItem.unit;
    rate = rate ?? boqItem.unit_rate;
  }

  if (rate === undefined || rate === null) throw ApiError.badRequest('rate is required (or supply boq_item_id to default from the BOQ item)');
  if (!description) throw ApiError.badRequest('description is required (or supply boq_item_id to default from the BOQ item)');
  if (!unit) throw ApiError.badRequest('unit is required (or supply boq_item_id to default from the BOQ item)');

  return transaction(async (client) => {
    const item = await poItemRepository.create(
      {
        po_id: data.po_id,
        boq_item_id: data.boq_item_id || null,
        description,
        unit,
        quantity: data.quantity,
        rate,
        tax_percentage: data.tax_percentage ?? 0,
        sequence_no: data.sequence_no,
        remarks: data.remarks || null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );
    await poRepository.recomputeTotals(data.po_id, client);
    await auditService.log({ entityType: 'PO', entityId: data.po_id, action: 'Update', userId: user.id, newValue: { po_item_created: item } }, client);
    return item;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  const po = await poRepository.findById(existing.po_id, { companyId: user.companyId });
  assertPoEditable(po);

  return transaction(async (client) => {
    const updated = await poItemRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('PO item not found');
    await poRepository.recomputeTotals(existing.po_id, client);
    await auditService.log({ entityType: 'PO', entityId: existing.po_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const po = await poRepository.findById(existing.po_id, { companyId: user.companyId });
  assertPoEditable(po);

  return transaction(async (client) => {
    const deleted = await poItemRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await poRepository.recomputeTotals(existing.po_id, client);
    await auditService.log({ entityType: 'PO', entityId: existing.po_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByPo, getById, create, update, remove, assertPoEditable };
