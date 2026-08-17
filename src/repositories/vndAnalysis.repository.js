'use strict';

const { query } = require('../config/database');
const { VIEWS } = require('../models/tables');

/**
 * Read-only access over the Vendor Management & Procurement submodule's
 * derived views (architecture doc §6.17/§6.18, Phase 10). Nothing is
 * written through this repository - the views are the single source of
 * truth for every derived/aggregated figure. Mirrors
 * src/repositories/clmClient360.repository.js.
 */
class VndAnalysisRepository {
  async vendorPerformance(vendorId) {
    const result = await query(`SELECT * FROM ${VIEWS.VENDOR_PERFORMANCE} WHERE vendor_id = $1`, [vendorId]);
    return result.rows[0] || null;
  }

  async vendorPoSummary(vendorId) {
    const result = await query(`SELECT * FROM ${VIEWS.VENDOR_PO_SUMMARY} WHERE vendor_id = $1`, [vendorId]);
    return result.rows[0] || null;
  }

  async vendorInvoiceSummary(vendorInvoiceId) {
    const result = await query(`SELECT * FROM ${VIEWS.VENDOR_INVOICE_SUMMARY} WHERE vendor_invoice_id = $1`, [vendorInvoiceId]);
    return result.rows[0] || null;
  }

  async vendorInvoiceSummaryByVendor(vendorId) {
    const result = await query(`SELECT * FROM ${VIEWS.VENDOR_INVOICE_SUMMARY} WHERE vendor_id = $1 ORDER BY vendor_invoice_id`, [vendorId]);
    return result.rows;
  }

  async vendorFinancialSummary(vendorId) {
    const result = await query(`SELECT * FROM ${VIEWS.VENDOR_FINANCIAL_SUMMARY} WHERE vendor_id = $1`, [vendorId]);
    return result.rows[0] || null;
  }

  async projectCostSummary(projectId) {
    const result = await query(`SELECT * FROM ${VIEWS.PROJECT_COST_SUMMARY} WHERE project_id = $1 ORDER BY cost_category`, [projectId]);
    return result.rows;
  }

  async projectFinancialSummary(projectId) {
    const result = await query(`SELECT * FROM ${VIEWS.PROJECT_FINANCIAL_SUMMARY} WHERE project_id = $1`, [projectId]);
    return result.rows[0] || null;
  }

  async projectFinancialSummaryList({ companyId } = {}) {
    // v_project_financial_summary carries no company_id column of its own -
    // join back to clm_project for company scoping when listing across projects.
    const params = [];
    let sql = `SELECT pfs.* FROM ${VIEWS.PROJECT_FINANCIAL_SUMMARY} pfs JOIN clm_project p ON p.project_id = pfs.project_id`;
    if (companyId) {
      params.push(companyId);
      sql += ` WHERE p.company_id = $1`;
    }
    sql += ' ORDER BY pfs.project_code ASC';
    const result = await query(sql, params);
    return result.rows;
  }
}

module.exports = new VndAnalysisRepository();
