'use strict';

const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

const T = TABLES.VND_VENDOR_INVOICE_ITEM.name;
const PK = TABLES.VND_VENDOR_INVOICE_ITEM.pk;

/**
 * A bare child row (doc §6.14): no company_id/branch_id/audit columns at
 * all, scoped entirely through its parent vnd_vendor_invoice - so this does
 * NOT extend BaseRepository (which assumes those columns exist). Every
 * caller must resolve/authorize the parent invoice itself first.
 */
class VndVendorInvoiceItemRepository {
  async findById(id) {
    const result = await query(`SELECT * FROM ${T} WHERE ${PK} = $1`, [id]);
    return result.rows[0] || null;
  }

  async findByInvoiceId(invoiceId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${T} WHERE vendor_invoice_id = $1 ORDER BY sequence_no ASC`, [invoiceId]);
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

  async update(id, data, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const columns = Object.keys(data);
    if (!columns.length) return this.findById(id);
    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);
    const values = Object.values(data);
    values.push(id);
    const result = await exec(`UPDATE ${T} SET ${setClauses.join(', ')} WHERE ${PK} = $${values.length} RETURNING *`, values);
    return result.rows[0] || null;
  }

  async remove(id, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`DELETE FROM ${T} WHERE ${PK} = $1 RETURNING *`, [id]);
    return result.rows[0] || null;
  }
}

module.exports = new VndVendorInvoiceItemRepository();
