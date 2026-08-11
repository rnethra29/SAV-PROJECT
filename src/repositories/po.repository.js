'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class PoRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.PO.name, pk: TABLES.PO.pk });
  }

  async findByNumber(poNumber, companyId) {
    const result = await query(`SELECT * FROM ${this.table} WHERE po_number = $1 AND company_id = $2 AND deleted_at IS NULL`, [poNumber, companyId]);
    return result.rows[0] || null;
  }

  async recomputeTotals(poId, client) {
    const exec = client ? client.query.bind(client) : query;
    await exec(
      `UPDATE ${this.table} p SET
         subtotal_amount = COALESCE(t.subtotal, 0),
         tax_amount = COALESCE(t.tax, 0),
         total_amount = COALESCE(t.subtotal, 0) + COALESCE(t.tax, 0),
         updated_at = now()
       FROM (
         SELECT po_id, SUM(amount) AS subtotal, SUM(amount * COALESCE(tax_percentage, 0) / 100) AS tax
         FROM com_po_items WHERE po_id = $1 AND deleted_at IS NULL GROUP BY po_id
       ) t
       WHERE p.po_id = $1 AND t.po_id = p.po_id`,
      [poId]
    );
    await exec(
      `UPDATE ${this.table} SET subtotal_amount = 0, tax_amount = 0, total_amount = 0
       WHERE po_id = $1 AND NOT EXISTS (SELECT 1 FROM com_po_items WHERE po_id = $1 AND deleted_at IS NULL)`,
      [poId]
    );
  }
}

module.exports = new PoRepository();
