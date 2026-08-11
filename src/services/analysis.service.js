'use strict';

const analysisRepository = require('../repositories/analysis.repository');
const ApiError = require('../utils/apiError');

async function itemCommercialAnalysis(user, reqQuery) {
  return analysisRepository.itemCommercialAnalysis({
    companyId: user.companyId,
    filters: { rfq_id: reqQuery.rfqId, item_code: reqQuery.itemCode, quotation_id: reqQuery.quotationId },
    pagination: reqQuery,
  });
}

async function itemCommercialAnalysisFinal(user, reqQuery) {
  return analysisRepository.itemCommercialAnalysisFinal({
    companyId: user.companyId,
    filters: { rfq_id: reqQuery.rfqId, item_code: reqQuery.itemCode, quotation_id: reqQuery.quotationId },
    pagination: reqQuery,
  });
}

async function estimationItemCost(user, reqQuery) {
  return analysisRepository.estimationItemCost({
    companyId: user.companyId,
    filters: { estimation_id: reqQuery.estimationId, item_code: reqQuery.itemCode },
    pagination: reqQuery,
  });
}

/** Full per-S.No traceability & calculation for a single RFQ item (architecture Phase 15). */
async function itemCommercialAnalysisByRfqItem(rfqItemId, user) {
  const row = await analysisRepository.itemCommercialAnalysisByRfqItem(rfqItemId, user.companyId);
  if (!row) throw ApiError.notFound('No commercial analysis available for this RFQ item yet');
  return row;
}

module.exports = { itemCommercialAnalysis, itemCommercialAnalysisFinal, estimationItemCost, itemCommercialAnalysisByRfqItem };
