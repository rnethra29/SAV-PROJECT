'use strict';

const boqItemRepository = require('../repositories/boqItem.repository');
const boqRepository = require('../repositories/boq.repository');
const rfqItemRepository = require('../repositories/rfqItem.repository');
const quotationItemRepository = require('../repositories/quotationItem.repository');
const negotiationOfferRepository = require('../repositories/negotiationOffer.repository');
const auditService = require('./audit.service');
const ApiError = require('../utils/apiError');
const { transaction, query } = require('../config/database');
const { wordCount } = require('../utils/helpers');

function assertBoqEditable(boq) {
  if (!['Draft', 'Tentative', 'Under Review'].includes(boq.status)) {
    throw ApiError.conflict(`BOQ items cannot be modified while status is '${boq.status}' - create a new version instead`, { code: 'BOQ_NOT_EDITABLE' });
  }
}

/**
 * Resolves the unit_rate to snapshot onto a BOQ item (architecture Phase 2
 * step 10 / Phase 14): prefer the latest settled (`is_final=true`)
 * negotiation offer for the sourcing quotation item; fall back to that
 * quotation item's `quoted_rate` if no final offer has been recorded yet.
 * Returns `{ rate, source }` so callers can surface provenance.
 */
async function resolveUnitRate(rfqItemId, quotationId) {
  const quoteItemsResult = await query(
    `SELECT * FROM com_quotation_items WHERE rfq_item_id = $1 AND quotation_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [rfqItemId, quotationId]
  );
  const quotationItem = quoteItemsResult.rows[0];
  if (!quotationItem) {
    return { rate: null, source: null, quotationItem: null };
  }

  const finalOffer = await negotiationOfferRepository.findLatestFinalByQuotationItemId(quotationItem.quotation_item_id);
  if (finalOffer) {
    return { rate: finalOffer.offered_rate, source: 'final_negotiation_offer', quotationItem };
  }
  return { rate: quotationItem.quoted_rate, source: 'quoted_rate_fallback', quotationItem };
}

async function listByBoq(boqId, user) {
  const boq = await boqRepository.findById(boqId, { companyId: user.companyId });
  if (!boq) throw ApiError.notFound('BOQ not found');
  return boqItemRepository.findByBoqId(boqId);
}

function buildTree(flatItems) {
  const byId = new Map(flatItems.map((item) => [item.boq_item_id, { ...item, children: [] }]));
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

async function getTree(boqId, user) {
  const flat = await listByBoq(boqId, user);
  return buildTree(flat);
}

async function getById(id, user) {
  const item = await boqItemRepository.findById(id, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('BOQ item not found');
  return item;
}

/**
 * Manual BOQ item creation. `description` is always human-authored (module
 * convention: no AI/OCR extraction, manual entry only) and is capped at 50
 * words - validated here (fast feedback) and again by the DB CHECK
 * (`com_fn_word_count`, defense-in-depth). `unit_rate` may be supplied
 * directly, or auto-resolved from the settled negotiation outcome for
 * `source_rfq_item_id` when `autoResolveRate` is set.
 */
async function create(data, user) {
  const boq = await boqRepository.findById(data.boq_id, { companyId: user.companyId });
  if (!boq) throw ApiError.badRequest('boq_id does not exist');
  assertBoqEditable(boq);

  const words = wordCount(data.description);
  if (words < 1 || words > 50) {
    throw ApiError.badRequest(`BOQ description must be 1-50 words (got ${words})`, { code: 'DESCRIPTION_WORD_COUNT' });
  }

  if (data.parent_item_id) {
    const parent = await boqItemRepository.findById(data.parent_item_id, { companyId: user.companyId });
    if (!parent) throw ApiError.badRequest('parent_item_id does not exist');
    if (parent.boq_id !== data.boq_id) throw ApiError.badRequest('parent_item_id must belong to the same BOQ');
  }

  let unitRate = data.unit_rate;
  let sourceQuotationItemId = data.source_quotation_item_id || null;

  if (data.autoResolveRate) {
    if (!data.source_rfq_item_id || !boq.quotation_id) {
      throw ApiError.badRequest('autoResolveRate requires source_rfq_item_id and a BOQ linked to a quotation_id');
    }
    const resolved = await resolveUnitRate(data.source_rfq_item_id, boq.quotation_id);
    if (resolved.rate === null) throw ApiError.badRequest('Could not resolve a rate: no quotation item found for source_rfq_item_id under this BOQ\'s quotation');
    unitRate = resolved.rate;
    sourceQuotationItemId = resolved.quotationItem.quotation_item_id;
  }

  if (unitRate === undefined || unitRate === null) {
    throw ApiError.badRequest('unit_rate is required unless autoResolveRate is used');
  }

  return transaction(async (client) => {
    const item = await boqItemRepository.create(
      {
        boq_id: data.boq_id,
        parent_item_id: data.parent_item_id || null,
        category_id: data.category_id || null,
        item_code: data.item_code,
        description: data.description,
        description_word_count: words,
        unit: data.unit,
        quantity: data.quantity,
        unit_rate: unitRate,
        sequence_no: data.sequence_no,
        source_rfq_item_id: data.source_rfq_item_id || null,
        source_quotation_item_id: sourceQuotationItemId,
        remarks: data.remarks || null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
        updated_by: user.id,
      },
      { client }
    );
    await auditService.log({ entityType: 'BOQ', entityId: data.boq_id, action: 'Update', userId: user.id, newValue: { boq_item_created: item } }, client);
    return item;
  });
}

async function update(id, data, user) {
  const existing = await getById(id, user);
  const boq = await boqRepository.findById(existing.boq_id, { companyId: user.companyId });
  assertBoqEditable(boq);

  const payload = { ...data };
  if (payload.description !== undefined) {
    const words = wordCount(payload.description);
    if (words < 1 || words > 50) throw ApiError.badRequest(`BOQ description must be 1-50 words (got ${words})`, { code: 'DESCRIPTION_WORD_COUNT' });
    payload.description_word_count = words;
  }

  if (payload.parent_item_id) {
    if (payload.parent_item_id === id) throw ApiError.badRequest('An item cannot be its own parent');
    if (await boqItemRepository.wouldCreateCycle(id, payload.parent_item_id)) {
      throw ApiError.badRequest('This would create a circular parent/child hierarchy');
    }
  }

  return transaction(async (client) => {
    const updated = await boqItemRepository.update(id, payload, { companyId: user.companyId, userId: user.id, client });
    if (!updated) throw ApiError.notFound('BOQ item not found');
    await auditService.log({ entityType: 'BOQ', entityId: existing.boq_id, action: 'Update', userId: user.id, oldValue: existing, newValue: updated }, client);
    return updated;
  });
}

async function remove(id, user) {
  const existing = await getById(id, user);
  const boq = await boqRepository.findById(existing.boq_id, { companyId: user.companyId });
  assertBoqEditable(boq);

  const childrenResult = await query(`SELECT COUNT(*)::int AS count FROM com_boq_items WHERE parent_item_id = $1 AND deleted_at IS NULL`, [id]);
  if (childrenResult.rows[0].count > 0) throw ApiError.conflict('Cannot delete a BOQ item that has child items', { code: 'HAS_DEPENDENTS' });

  const poResult = await query(`SELECT 1 FROM com_po_items WHERE boq_item_id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
  if (poResult.rowCount > 0) throw ApiError.conflict('Cannot delete a BOQ item already referenced by a PO item', { code: 'HAS_DEPENDENTS' });

  return transaction(async (client) => {
    const deleted = await boqItemRepository.softDeleteById(id, { companyId: user.companyId, userId: user.id, client });
    await auditService.log({ entityType: 'BOQ', entityId: existing.boq_id, action: 'Delete', userId: user.id, oldValue: existing }, client);
    return deleted;
  });
}

module.exports = { listByBoq, getTree, getById, create, update, remove, resolveUnitRate, buildTree, assertBoqEditable };
