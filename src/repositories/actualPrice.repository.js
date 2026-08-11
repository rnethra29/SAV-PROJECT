'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class ActualPriceRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.ACTUAL_PRICE.name, pk: TABLES.ACTUAL_PRICE.pk, softDelete: false });
  }

  async findByRfqItemId(rfqItemId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${this.table} WHERE rfq_item_id = $1`, [rfqItemId]);
    return result.rows[0] || null;
  }
}

module.exports = new ActualPriceRepository();
