'use strict';

const BaseRepository = require('../../../shared/backend/repositories/base.repository');
const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');

class BoqItemRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.BOQ_ITEMS.name, pk: TABLES.BOQ_ITEMS.pk });
  }

  async findByBoqId(boqId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${this.table} WHERE boq_id = $1 AND deleted_at IS NULL ORDER BY sequence_no ASC`, [boqId]);
    return result.rows;
  }

  async wouldCreateCycle(itemId, candidateParentId) {
    if (itemId === candidateParentId) return true;
    let current = candidateParentId;
    const visited = new Set();
    while (current) {
      if (current === itemId) return true;
      if (visited.has(current)) return true;
      visited.add(current);
      const result = await query(`SELECT parent_item_id FROM ${this.table} WHERE ${this.pk} = $1`, [current]);
      current = result.rows[0] ? result.rows[0].parent_item_id : null;
    }
    return false;
  }
}

module.exports = new BoqItemRepository();
