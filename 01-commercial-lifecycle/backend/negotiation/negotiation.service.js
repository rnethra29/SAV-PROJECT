'use strict';

const negotiationOfferRepository = require('./negotiationOffer.repository');
const quotationRepository = require('../quotation/quotation.repository');
const quotationItemRepository = require('../quotation/quotationItem.repository');
const auditService = require('../../../shared/backend/documents-approvals-audit/services/audit.service');
const approvalService = require('../../../shared/backend/documents-approvals-audit/services/approval.service');
const ApiError = require('../../../shared/backend/utils/apiError');
const { transaction } = require('../../../shared/backend/config/database');
const { APPROVAL_STAGES } = require('../../../shared/backend/models/approvalStages');

async function listByQuotation(quotationId, user, pagination) {
  const quotation = await quotationRepository.findById(quotationId, { companyId: user.companyId });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return negotiationOfferRepository.findByQuotationId(quotationId, pagination);
}

async function listByQuotationItem(quotationItemId, user, pagination) {
  const item = await quotationItemRepository.findById(quotationItemId, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('Quotation item not found');
  return negotiationOfferRepository.findByQuotationItemId(quotationItemId, pagination);
}

async function getFinal(quotationItemId, user) {
  const item = await quotationItemRepository.findById(quotationItemId, { companyId: user.companyId });
  if (!item) throw ApiError.notFound('Quotation item not found');
  const final = await negotiationOfferRepository.findLatestFinalByQuotationItemId(quotationItemId);
  if (!final) throw ApiError.notFound('No final offer has been recorded for this quotation item yet');
  return final;
}

/**
 * Records a new offer/counter-offer (architecture Phase 5.10: append-only,
 * `is_final` marks the settled offer). "Marking final" is simply recording
 * a new row with `is_final = true` and `offer_type = 'Final'` - existing
 * rows are never mutated; readers always take the most recent
 * `is_final = true` row per item (see v_item_commercial_analysis_final).
 */
async function create(data, user) {
  const quotation = await quotationRepository.findById(data.quotation_id, { companyId: user.companyId });
  if (!quotation) throw ApiError.badRequest('quotation_id does not exist');

  if (data.quotation_item_id) {
    const item = await quotationItemRepository.findById(data.quotation_item_id, { companyId: user.companyId });
    if (!item) throw ApiError.badRequest('quotation_item_id does not exist');
    if (item.quotation_id !== data.quotation_id) throw ApiError.badRequest('quotation_item_id must belong to the given quotation_id');
  }

  // Architecture Phase 8 rule #13 / Phase 1.2: the settled negotiation outcome may not be locked in as `is_final`
  // without an Approved "Final Commercial Decision" sign-off on record for this item (or quotation, if item-level).
  if (data.is_final) {
    const gateEntityId = data.quotation_item_id || data.quotation_id;
    if (!(await approvalService.isApproved('FinalCommercialDecision', gateEntityId, APPROVAL_STAGES.FINAL_COMMERCIAL_DECISION))) {
      throw ApiError.conflict(
        `An offer cannot be marked is_final=true without an Approved '${APPROVAL_STAGES.FINAL_COMMERCIAL_DECISION}' record for this ${data.quotation_item_id ? 'quotation item' : 'quotation'}`,
        { code: 'APPROVAL_REQUIRED' }
      );
    }
  }

  return transaction(async (client) => {
    const offer = await negotiationOfferRepository.create(
      {
        quotation_id: data.quotation_id,
        quotation_item_id: data.quotation_item_id || null,
        offer_type: data.offer_type,
        offered_amount: data.quotation_item_id ? null : data.offered_amount,
        offered_rate: data.quotation_item_id ? data.offered_rate : null,
        offered_by: data.offered_by,
        response_status: data.response_status || 'Pending',
        payment_terms: data.payment_terms || null,
        validity_date: data.validity_date || null,
        commercial_conditions: data.commercial_conditions || null,
        is_final: Boolean(data.is_final),
        remarks: data.remarks || null,
        company_id: user.companyId,
        branch_id: user.branchId,
        created_by: user.id,
      },
      { client }
    );

    await auditService.log(
      { entityType: 'Negotiation', entityId: data.quotation_item_id || data.quotation_id, action: 'Insert', userId: user.id, newValue: offer },
      client
    );

    return offer;
  });
}

module.exports = { listByQuotation, listByQuotationItem, getFinal, create };
