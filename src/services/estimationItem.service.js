'use strict';

const estimationItemRepository = require('../repositories/estimationItem.repository');
const estimationRepository = require('../repositories/estimation.repository');
const rfqItemRepository = require('../repositories/rfqItem.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');

async function listByEstimation(estimationId, user) {
  const estimation = await estimationRepository.findById(estimationId, { companyId: user.companyId });
  if (!estimation) throw ApiError.notFound('Estimation not found');
  return estimationItemRepository.findByEstimationId(estimationId);
}

async function getById(id, user) {
  const item = await estimationItemRepository.findById(id, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('Estimation item not found');
  return item;
}

/** Architecture Phase 15: `estimated_total_cost` = estimated_unit_cost x RFQ item quantity, always read via v_estimation_item_cost - see analysis module. */
async function getCostBreakup(id, user) {
  const item = await getById(id, user);
  const result = await query('SELECT * FROM v_estimation_item_cost WHERE estimation_item_id = $1', [id]);
  return result.rows[0] || item;
}

async function create(data, user) {
  const estimation = await estimationRepository.findById(data.estimation_id, { companyId: user.companyId });
  if (!estimation) throw ApiError.badRequest('estimation_id does not exist');

  const rfqItem = await rfqItemRepository.findById(data.rfq_item_id, { companyId: user.companyId });
  if (!rfqItem) throw ApiError.badRequest('rfq_item_id does not exist');
  if (rfqItem.rfq_id !== estimation.rfq_id) throw ApiError.badRequest('rfq_item_id must belong to the same RFQ as the Estimation');

  const existing = await estimationItemRepository.findByRfqItemId(data.rfq_item_id);
  if (existing) throw ApiError.conflict('This RFQ item already has an Estimation item (1:1 relationship, architecture Phase 5.4)', { code: 'UNIQUE_VIOLATION' });

  return transaction(async (client) => {
    const item = await estimationItemRepository.create(
      { ...data, company_id: user.companyId, branch_id: user.branchId, created_by: user.id, updated_by: user.id },
      { client }
    );
    await auditService.log({ entityType: 'Estimation', entityId: data.estimation_id, action: 'Update', userId: user.id, newValue: { estimation_item_created: item } }, client);
    return item;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);

  return transaction(async (client) => {
    const updated = await estimationItemRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Estimation item not found');
    await auditService.log({ entityType: 'Estimation', entityId: existing.estimation_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);

  const quoteItemsResult = await query(
    `SELECT COUNT(*)::int AS count FROM com_quotation_items WHERE estimation_item_id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (quoteItemsResult.rows[0].count > 0) {
    throw ApiError.conflict('Cannot delete an Estimation item already referenced by a Quotation item', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await estimationItemRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'Estimation', entityId: existing.estimation_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByEstimation, getById, getCostBreakup, create, update, remove };
