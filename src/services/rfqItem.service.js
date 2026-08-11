'use strict';

const rfqItemRepository = require('../repositories/rfqItem.repository');
const rfqRepository = require('../repositories/rfq.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');

/** Builds the parent/child tree (architecture Phase 6: "recursive CTEs used to materialize the hierarchy for display" - done here client-side in JS for simplicity/portability once the flat, sequence-ordered list is fetched). */
function buildTree(flatItems) {
  const byId = new Map(flatItems.map((item) => [item.rfq_item_id, { ...item, children: [] }]));
  const roots = [];
  for (const item of byId.values()) {
    if (item.parent_item_id && byId.has(item.parent_item_id)) {
      byId.get(item.parent_item_id).children.push(item);
    } else {
      roots.push(item);
    }
  }
  return roots;
}

async function assertRfqExists(rfqId, companyId) {
  const rfq = await rfqRepository.findById(rfqId, { companyId });
  if (!rfq) throw ApiError.notFound('RFQ not found');
  return rfq;
}

async function listByRfq(rfqId, user) {
  await assertRfqExists(rfqId, user.companyId);
  return rfqItemRepository.findByRfqId(rfqId);
}

async function getTree(rfqId, user) {
  const flat = await listByRfq(rfqId, user);
  return buildTree(flat);
}

async function getById(id, user) {
  const item = await rfqItemRepository.findById(id, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('RFQ item not found');
  return item;
}

async function create(data, user) {
  await assertRfqExists(data.rfq_id, user.companyId);

  if (data.parent_item_id) {
    const parent = await rfqItemRepository.findById(data.parent_item_id, { companyId: user.companyId });
    if (!parent) throw ApiError.badRequest('parent_item_id does not exist');
    if (parent.rfq_id !== data.rfq_id) throw ApiError.badRequest('parent_item_id must belong to the same RFQ');
  }

  return transaction(async (client) => {
    const item = await rfqItemRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'RFQ', entityId: data.rfq_id, action: 'Update', userId: user.id, newValue: { rfq_item_created: item } }, client);
    return item;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  if (data.parent_item_id) {
    if (data.parent_item_id === id) throw ApiError.badRequest('An item cannot be its own parent');
    const parent = await rfqItemRepository.findById(data.parent_item_id, { companyId: user.companyId });
    if (!parent) throw ApiError.badRequest('parent_item_id does not exist');
    if (parent.rfq_id !== existing.rfq_id) throw ApiError.badRequest('parent_item_id must belong to the same RFQ');
    if (await rfqItemRepository.wouldCreateCycle(id, data.parent_item_id)) {
      throw ApiError.badRequest('This would create a circular parent/child hierarchy');
    }
  }

  return transaction(async (client) => {
    const updated = await rfqItemRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('RFQ item not found');
    await auditService.log({ entityType: 'RFQ', entityId: existing.rfq_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const childrenResult = await query(
    `SELECT COUNT(*)::int AS count FROM com_rfq_items WHERE parent_item_id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (childrenResult.rows[0].count > 0) {
    throw ApiError.conflict('Cannot delete an RFQ item that has child items', { code: 'HAS_DEPENDENTS' });
  }

  const estResult = await query(
    `SELECT COUNT(*)::int AS count FROM com_estimation_items WHERE rfq_item_id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (estResult.rows[0].count > 0) {
    throw ApiError.conflict('Cannot delete an RFQ item that already has an Estimation item - remove that first', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await rfqItemRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'RFQ', entityId: existing.rfq_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByRfq, getTree, getById, create, update, remove, buildTree };
