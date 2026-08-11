'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class QuotationItemRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.QUOTATION_ITEMS.name, pk: TABLES.QUOTATION_ITEMS.pk });
  }

  async findByQuotationId(quotationId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE quotation_id = $1 AND deleted_at IS NULL ORDER BY item_code ASC`,
      [quotationId]
    );
    return result.rows;
  }

  async findByRfqItemId(rfqItemId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE rfq_item_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [rfqItemId]
    );
    return result.rows;
  }
}

module.exports = new QuotationItemRepository();
