'use strict';

const BaseRepository = require('../../../shared/backend/repositories/base.repository');
const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');

class QuotationRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.QUOTATION.name, pk: TABLES.QUOTATION.pk });
  }

  async findVersionsByNumber(quotationNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE quotation_number = $1 AND company_id = $2 AND deleted_at IS NULL ORDER BY version_no ASC`,
      [quotationNumber, companyId]
    );
    return result.rows;
  }

  async findLatestVersion(quotationNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE quotation_number = $1 AND company_id = $2 AND deleted_at IS NULL ORDER BY version_no DESC LIMIT 1`,
      [quotationNumber, companyId]
    );
    return result.rows[0] || null;
  }

  /** True if some other quotation row already points back to this one (i.e. it already has a next version). */
  async hasNewerVersion(quotationId) {
    const result = await query(`SELECT 1 FROM ${this.table} WHERE previous_version_id = $1 AND deleted_at IS NULL LIMIT 1`, [quotationId]);
    return result.rowCount > 0;
  }

  async recomputeTotals(quotationId, client) {
    const exec = client ? client.query.bind(client) : query;
    await exec(
      `UPDATE ${this.table} q SET
         subtotal_amount = COALESCE(t.subtotal, 0),
         tax_amount = COALESCE(t.tax, 0),
         total_amount = COALESCE(t.subtotal, 0) + COALESCE(t.tax, 0),
         updated_at = now()
       FROM (
         SELECT quotation_id,
                SUM(quoted_amount) AS subtotal,
                SUM(quoted_amount * COALESCE(tax_percentage, 0) / 100) AS tax
         FROM com_quotation_items
         WHERE quotation_id = $1 AND deleted_at IS NULL
         GROUP BY quotation_id
       ) t
       WHERE q.quotation_id = $1 AND t.quotation_id = q.quotation_id`,
      [quotationId]
    );
    // Zero out totals if the quotation now has no items left.
    await exec(
      `UPDATE ${this.table} SET subtotal_amount = 0, tax_amount = 0, total_amount = 0
       WHERE quotation_id = $1 AND NOT EXISTS (SELECT 1 FROM com_quotation_items WHERE quotation_id = $1 AND deleted_at IS NULL)`,
      [quotationId]
    );
  }
}

module.exports = new QuotationRepository();
