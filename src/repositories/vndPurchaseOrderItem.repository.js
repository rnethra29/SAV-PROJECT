'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

/** No deleted_at column (doc §6.12 - CORE_NO_SOFT_DELETE); item rows are covered by trg_vnd_po_totals, which recalculates the header total on every INSERT/UPDATE/DELETE. */
class VndPurchaseOrderItemRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.VND_PURCHASE_ORDER_ITEM.name, pk: TABLES.VND_PURCHASE_ORDER_ITEM.pk, softDelete: false });
  }

  async findByPoId(poId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${this.table} WHERE po_id = $1 ORDER BY sequence_no ASC`, [poId]);
    return result.rows;
  }

  /** Hard delete is the only way to trigger trg_vnd_po_totals' recalculation for a removed line - there's no deleted_at to soft-delete against. Callers must first confirm the item has no dependent vendor invoice items. */
  async remove(id, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`DELETE FROM ${this.table} WHERE ${this.pk} = $1 RETURNING *`, [id]);
    return result.rows[0] || null;
  }
}

module.exports = new VndPurchaseOrderItemRepository();
