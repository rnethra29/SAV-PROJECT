'use strict';

const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

const T = TABLES.CLM_PAYMENT_ALLOCATION.name;

/**
 * Append-only junction (architecture doc §6.10: "corrected by a reversing
 * new row per accounting practice, not by update" - the same ledger
 * convention as com_negotiation_offers). SUM-across-rows guards live in the
 * `clm_fn_check_allocation` DB trigger (017_clm_payment_tables.sql), not here.
 */
class ClmPaymentAllocationRepository {
  async findById(id, companyId) {
    const result = await query(`SELECT * FROM ${T} WHERE allocation_id = $1 AND company_id = $2`, [id, companyId]);
    return result.rows[0] || null;
  }

  async findByPaymentId(paymentId) {
    const result = await query(`SELECT * FROM ${T} WHERE payment_id = $1 ORDER BY allocated_date ASC`, [paymentId]);
    return result.rows;
  }

  async findByInvoiceId(invoiceId) {
    const result = await query(`SELECT * FROM ${T} WHERE invoice_id = $1 ORDER BY allocated_date ASC`, [invoiceId]);
    return result.rows;
  }

  async create(data, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await exec(`INSERT INTO ${T} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`, values);
    return result.rows[0];
  }
}

module.exports = new ClmPaymentAllocationRepository();
