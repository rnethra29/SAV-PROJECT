'use strict';

const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

const T = TABLES.VND_VENDOR_PAYMENT_ALLOCATION.name;

/** Append-only junction (doc §6.16, same ledger convention as clm_payment_allocation). SUM-across-rows guards live in the vnd_fn_check_allocation DB trigger (026_vnd_vendor_payment_tables.sql), not here. */
class VndVendorPaymentAllocationRepository {
  async findById(id, companyId) {
    const result = await query(`SELECT * FROM ${T} WHERE allocation_id = $1 AND company_id = $2`, [id, companyId]);
    return result.rows[0] || null;
  }

  async findByPaymentId(paymentId) {
    const result = await query(`SELECT * FROM ${T} WHERE vendor_payment_id = $1 ORDER BY allocated_date ASC`, [paymentId]);
    return result.rows;
  }

  async findByInvoiceId(invoiceId) {
    const result = await query(`SELECT * FROM ${T} WHERE vendor_invoice_id = $1 ORDER BY allocated_date ASC`, [invoiceId]);
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

module.exports = new VndVendorPaymentAllocationRepository();
