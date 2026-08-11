'use strict';

const quotationItemRepository = require('../repositories/quotationItem.repository');
const quotationRepository = require('../repositories/quotation.repository');
const rfqItemRepository = require('../repositories/rfqItem.repository');
const estimationItemRepository = require('../repositories/estimationItem.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');

async function assertQuotationEditable(quotation) {
  if (quotation.status !== 'Draft' && quotation.status !== 'Under Approval') {
    throw ApiError.conflict(`Quotation items cannot be modified while status is '${quotation.status}' - create a new version instead`, { code: 'QUOTATION_NOT_EDITABLE' });
  }
}

async function listByQuotation(quotationId, user) {
  const quotation = await quotationRepository.findById(quotationId, { companyId: user.companyId });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return quotationItemRepository.findByQuotationId(quotationId);
}

async function getById(id, user) {
  const item = await quotationItemRepository.findById(id, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('Quotation item not found');
  return item;
}

/**
 * Creates a quotation item. `quantity`/`unit` are always snapshotted from
 * the source RFQ item at this moment (architecture Phase 14: "quantity,
 * unit snapshotted onto the quotation item ... so historical quotations
 * remain accurate even if the RFQ item is later edited") - client-supplied
 * quantity/unit, if any, are ignored in favor of the authoritative snapshot.
 */
async function create(data, user) {
  const quotation = await quotationRepository.findById(data.quotation_id, { companyId: user.companyId });
  if (!quotation) throw ApiError.badRequest('quotation_id does not exist');
  await assertQuotationEditable(quotation);

  const rfqItem = await rfqItemRepository.findById(data.rfq_item_id, { companyId: user.companyId });
  if (!rfqItem) throw ApiError.badRequest('rfq_item_id does not exist');
  if (rfqItem.rfq_id !== quotation.rfq_id) throw ApiError.badRequest('rfq_item_id must belong to the same RFQ as the Quotation');

  if (data.estimation_item_id) {
    const estimationItem = await estimationItemRepository.findById(data.estimation_item_id, { companyId: user.companyId });
    if (!estimationItem) throw ApiError.badRequest('estimation_item_id does not exist');
    if (estimationItem.rfq_item_id !== data.rfq_item_id) throw ApiError.badRequest('estimation_item_id must correspond to the same rfq_item_id');
  }

  return transaction(async (client) => {
    const item = await quotationItemRepository.create(
      {
        quotation_id: data.quotation_id,
        rfq_item_id: data.rfq_item_id,
        estimation_item_id: data.estimation_item_id || null,
        item_code: rfqItem.item_code,
        quantity: rfqItem.quantity,
        unit: rfqItem.unit,
        quoted_rate: data.quoted_rate,
        tax_percentage: data.tax_percentage ?? 0,
        remarks: data.remarks || null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );
    await quotationRepository.recomputeTotals(data.quotation_id, client);
    await auditService.log({ entityType: 'Quotation', entityId: data.quotation_id, action: 'Update', userId: user.id, newValue: { quotation_item_created: item } }, client);
    return item;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  const quotation = await quotationRepository.findById(existing.quotation_id, { companyId: user.companyId });
  await assertQuotationEditable(quotation);

  return transaction(async (client) => {
    const updated = await quotationItemRepository.update(id, data, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('Quotation item not found');
    await quotationRepository.recomputeTotals(existing.quotation_id, client);
    await auditService.log({ entityType: 'Quotation', entityId: existing.quotation_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const quotation = await quotationRepository.findById(existing.quotation_id, { companyId: user.companyId });
  await assertQuotationEditable(quotation);

  const negotiationResult = await query(`SELECT 1 FROM com_negotiation_offers WHERE quotation_item_id = $1 LIMIT 1`, [id]);
  if (negotiationResult.rowCount > 0) {
    throw ApiError.conflict('Cannot delete a quotation item that already has negotiation offers', { code: 'HAS_DEPENDENTS' });
  }

  return transaction(async (client) => {
    const deleted = await quotationItemRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await quotationRepository.recomputeTotals(existing.quotation_id, client);
    await auditService.log({ entityType: 'Quotation', entityId: existing.quotation_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByQuotation, getById, create, update, remove };
