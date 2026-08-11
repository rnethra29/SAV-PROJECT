'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class EstimationItemRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.ESTIMATION_ITEMS.name, pk: TABLES.ESTIMATION_ITEMS.pk });
  }

  async findByEstimationId(estimationId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE estimation_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
      [estimationId]
    );
    return result.rows;
  }

  /** Enforces the 1:1 RFQ item <-> Estimation item relationship (architecture Phase 5.4 U constraint) ahead of the DB unique constraint, for a friendlier error. */
  async findByRfqItemId(rfqItemId) {
    const result = await query(`SELECT * FROM ${this.table} WHERE rfq_item_id = $1 AND deleted_at IS NULL`, [rfqItemId]);
    return result.rows[0] || null;
  }
}

module.exports = new EstimationItemRepository();
