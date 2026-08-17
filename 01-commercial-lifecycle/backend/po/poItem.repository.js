'use strict';

const BaseRepository = require('../../../shared/backend/repositories/base.repository');
const { query } = require('../../../shared/backend/config/database');
const { TABLES } = require('../../../shared/backend/models/tables');

class PoItemRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.PO_ITEMS.name, pk: TABLES.PO_ITEMS.pk });
  }

  async findByPoId(poId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${this.table} WHERE po_id = $1 AND deleted_at IS NULL ORDER BY sequence_no ASC`, [poId]);
    return result.rows;
  }
}

module.exports = new PoItemRepository();
