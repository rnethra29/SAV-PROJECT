'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class ClmClientInvoiceRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_CLIENT_INVOICE.name, pk: TABLES.CLM_CLIENT_INVOICE.pk });
  }

  async findByNumber(invoiceNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE invoice_number = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [invoiceNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new ClmClientInvoiceRepository();
