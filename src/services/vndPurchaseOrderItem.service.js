'use strict';

const vndPurchaseOrderItemRepository = require('../repositories/vndPurchaseOrderItem.repository');
const vndPurchaseOrderRepository = require('../repositories/vndPurchaseOrder.repository');
const auditService = require('../services/audit.service');
const ApiError = require('../utils/apiError');
const { transaction } = require('../config/database');

/** Line items are only mutable while the PO is still 'Draft' - once submitted into the approval chain, the printed/approved total must not silently drift (doc §6.11's whole reason for the header-total trigger). */
function assertPoEditable(po) {
  if (po.status !== 'Draft') {
    throw ApiError.conflict(`PO items cannot be modified while PO status is '${po.status}' - only 'Draft' purchase orders are editable`, { code: 'PO_NOT_EDITABLE' });
  }
}

async function listByPo(poId, user) {
  const po = await vndPurchaseOrderRepository.findById(poId, { companyId: user.companyId });
  if (!po) throw ApiError.notFound('Purchase order not found');
  return vndPurchaseOrderItemRepository.findByPoId(poId);
}

async function getById(id, user) {
  const item = await vndPurchaseOrderItemRepository.findById(id, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('PO item not found');
  return item;
}

async function create(data, user) {
  const po = await vndPurchaseOrderRepository.findById(data.po_id, { companyId: user.companyId });
  if (!po) throw ApiError.badRequest('po_id does not exist');
  assertPoEditable(po);

  return transaction(async (client) => {
    const item = await vndPurchaseOrderItemRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    // trg_vnd_po_totals recalculates subtotal/discount/tax/total on the PO header automatically.
    await auditService.log({ entityType: 'ProcurementPO', entityId: data.po_id, action: 'Update', userId: user.id, newValue: { po_item_created: item } }, client);
    return item;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  const po = await vndPurchaseOrderRepository.findById(existing.po_id, { companyId: user.companyId });
  assertPoEditable(po);

  return transaction(async (client) => {
    const updated = await vndPurchaseOrderItemRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('PO item not found');
    await auditService.log({ entityType: 'ProcurementPO', entityId: existing.po_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const po = await vndPurchaseOrderRepository.findById(existing.po_id, { companyId: user.companyId });
  assertPoEditable(po);

  return transaction(async (client) => {
    const deleted = await vndPurchaseOrderItemRepository.remove(id, { client });
    await auditService.log({ entityType: 'ProcurementPO', entityId: existing.po_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByPo, getById, create, update, remove, assertPoEditable };
