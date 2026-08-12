'use strict';

const { query } = require('../config/database');
const { VIEWS } = require('../models/tables');
const { parsePagination } = require('../utils/helpers');

/**
 * Read-only access over the Client Management submodule's derived views
 * (architecture doc §11/§13, src/database/migrations/019_clm_views.sql).
 * Every method here scopes by `client_id`; nothing is written through this
 * repository - the views themselves are the single source of truth for
 * every derived/aggregated figure (doc §12: "everything in this table is a
 * view, never a stored/duplicated column").
 */
class ClmClient360Repository {
  async overview(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_360_OVERVIEW} WHERE client_id = $1`, [clientId]);
    return result.rows[0] || null;
  }

  async financialSummary(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_FINANCIAL_SUMMARY} WHERE client_id = $1`, [clientId]);
    return result.rows[0] || null;
  }

  async projects(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_PROJECT_SUMMARY} WHERE client_id = $1`, [clientId]);
    return result.rows;
  }

  async rfqHistory(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_RFQ_HISTORY} WHERE client_id = $1 ORDER BY rfq_id`, [clientId]);
    return result.rows;
  }

  async boqSummary(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_BOQ_SUMMARY} WHERE client_id = $1`, [clientId]);
    return result.rows;
  }

  async poSummary(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_PO_SUMMARY} WHERE client_id = $1`, [clientId]);
    return result.rows;
  }

  async billingSummary(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_BILLING_SUMMARY} WHERE client_id = $1 ORDER BY invoice_id`, [clientId]);
    return result.rows;
  }

  async paymentSummary(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_PAYMENT_SUMMARY} WHERE client_id = $1 ORDER BY payment_id`, [clientId]);
    return result.rows;
  }

  async outstanding(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_OUTSTANDING} WHERE client_id = $1`, [clientId]);
    return result.rows[0] || { client_id: clientId, total_outstanding: 0 };
  }

  async costUtilization(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_COST_UTILIZATION} WHERE client_id = $1`, [clientId]);
    return result.rows;
  }

  async profitAnalysis(clientId) {
    const result = await query(`SELECT * FROM ${VIEWS.CLIENT_PROFIT_ANALYSIS} WHERE client_id = $1`, [clientId]);
    return result.rows[0] || null;
  }

  async documents(clientId, entityIds) {
    // entityIds: { Client: clientId, ClientContact: [...], ClientRequirement: [...], ClientInvoice: [...], ClientPayment: [...] }
    const result = await query(
      `SELECT * FROM ${VIEWS.CLIENT_DOCUMENTS}
       WHERE (entity_type = 'Client' AND entity_id = $1)
          OR (entity_type = 'ClientContact' AND entity_id = ANY($2::uuid[]))
          OR (entity_type = 'ClientRequirement' AND entity_id = ANY($3::uuid[]))
          OR (entity_type = 'ClientInvoice' AND entity_id = ANY($4::uuid[]))
          OR (entity_type = 'ClientPayment' AND entity_id = ANY($5::uuid[]))
       ORDER BY created_at DESC`,
      [
        clientId,
        entityIds.contactIds || [],
        entityIds.requirementIds || [],
        entityIds.invoiceIds || [],
        entityIds.paymentIds || [],
      ]
    );
    return result.rows;
  }

  async activityHistory(clientId, entityIds, pagination = {}) {
    const { page, limit, offset } = parsePagination(pagination);
    const params = [clientId, entityIds.requirementIds || [], entityIds.invoiceIds || [], entityIds.rfqIds || []];
    const whereSql = `(entity_type = 'Client' AND entity_id = $1)
          OR (entity_type = 'ClientRequirement' AND entity_id = ANY($2::uuid[]))
          OR (entity_type = 'ClientInvoice' AND entity_id = ANY($3::uuid[]))
          OR (entity_type = 'RFQ' AND entity_id = ANY($4::uuid[]))`;
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${VIEWS.CLIENT_ACTIVITY_HISTORY} WHERE ${whereSql}`, params);
    params.push(limit, offset);
    const dataResult = await query(
      `SELECT * FROM ${VIEWS.CLIENT_ACTIVITY_HISTORY} WHERE ${whereSql} ORDER BY event_time DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows: dataResult.rows, page, limit, total: countResult.rows[0].total };
  }
}

module.exports = new ClmClient360Repository();
