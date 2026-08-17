'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class ClmProjectExpenseRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_PROJECT_EXPENSE.name, pk: TABLES.CLM_PROJECT_EXPENSE.pk });
  }

  async findByVendorInvoiceId(vendorInvoiceId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${this.table} WHERE vendor_invoice_id = $1 AND deleted_at IS NULL`, [vendorInvoiceId]);
    return result.rows;
  }
}

module.exports = new ClmProjectExpenseRepository();
