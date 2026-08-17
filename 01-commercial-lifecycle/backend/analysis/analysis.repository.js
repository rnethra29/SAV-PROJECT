'use strict';

const { query } = require('../../../shared/backend/config/database');
const { VIEWS } = require('../../../shared/backend/models/tables');
const { parsePagination } = require('../../../shared/backend/utils/helpers');

async function queryView(viewName, { companyId, filters = {}, pagination = {} }) {
  const { page, limit, offset } = parsePagination(pagination);
  const whereClauses = ['company_id = $1'];
  const params = [companyId];

  for (const [col, val] of Object.entries(filters)) {
    if (val === undefined || val === null || val === '') continue;
    params.push(val);
    whereClauses.push(`${col} = $${params.length}`);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${viewName} ${whereSql}`, params);
  const total = countResult.rows[0].total;

  params.push(limit, offset);
  const dataResult = await query(
    `SELECT * FROM ${viewName} ${whereSql} ORDER BY item_code ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: dataResult.rows, page, limit, total };
}

async function itemCommercialAnalysis(opts) {
  return queryView(VIEWS.ITEM_COMMERCIAL_ANALYSIS, opts);
}

async function itemCommercialAnalysisFinal(opts) {
  return queryView('v_item_commercial_analysis_final', opts);
}

async function estimationItemCost(opts) {
  return queryView(VIEWS.ESTIMATION_ITEM_COST, opts);
}

async function itemCommercialAnalysisByRfqItem(rfqItemId, companyId) {
  const result = await query(`SELECT * FROM ${VIEWS.ITEM_COMMERCIAL_ANALYSIS} WHERE rfq_item_id = $1 AND company_id = $2`, [rfqItemId, companyId]);
  return result.rows[0] || null;
}

module.exports = { itemCommercialAnalysis, itemCommercialAnalysisFinal, estimationItemCost, itemCommercialAnalysisByRfqItem };
