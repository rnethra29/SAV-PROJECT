'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class ClmClientInvoiceLineRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_CLIENT_INVOICE_LINE.name, pk: TABLES.CLM_CLIENT_INVOICE_LINE.pk });
  }

  async findByInvoiceId(invoiceId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE invoice_id = $1 AND deleted_at IS NULL ORDER BY sequence_no ASC`,
      [invoiceId]
    );
    return result.rows;
  }
}

module.exports = new ClmClientInvoiceLineRepository();
