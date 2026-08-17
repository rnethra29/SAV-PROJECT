'use strict';

const BaseRepository = require('../../../shared/backend/repositories/base.repository');
const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');

class RfqItemRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.RFQ_ITEMS.name, pk: TABLES.RFQ_ITEMS.pk });
  }

  async findByRfqId(rfqId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `SELECT * FROM ${this.table} WHERE rfq_id = $1 AND deleted_at IS NULL ORDER BY sequence_no ASC`,
      [rfqId]
    );
    return result.rows;
  }

  /** True if `candidateAncestorId` is `itemId` itself or one of its ancestors - used to block cycles on re-parenting. */
  async wouldCreateCycle(itemId, candidateParentId) {
    if (itemId === candidateParentId) return true;
    let current = candidateParentId;
    const visited = new Set();
    while (current) {
      if (current === itemId) return true;
      if (visited.has(current)) return true; // pre-existing cycle safety net
      visited.add(current);
      const result = await query(`SELECT parent_item_id FROM ${this.table} WHERE ${this.pk} = $1`, [current]);
      current = result.rows[0] ? result.rows[0].parent_item_id : null;
    }
    return false;
  }
}

module.exports = new RfqItemRepository();
