'use strict';

const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');
const { parsePagination } = require('../../../../shared/backend/utils/helpers');

const T = TABLES.CLM_CLIENT_STATUS_HISTORY.name;

/** Append-only, polymorphic (ClientRequirement/ClientInvoice only - doc §6.11). Mirrors auditLog.repository.js's record()/findByEntity() shape. */
class ClmClientStatusHistoryRepository {
  /**
   * @param {{ entity_type: string, entity_id: string, old_status?: string, new_status: string, changed_by: string, remarks?: string }} entry
   * @param {import('pg').PoolClient} [client]
   */
  async record(entry, client) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `INSERT INTO ${T} (entity_type, entity_id, old_status, new_status, changed_by, remarks)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [entry.entity_type, entry.entity_id, entry.old_status || null, entry.new_status, entry.changed_by, entry.remarks || null]
    );
    return result.rows[0];
  }

  async findByEntity(entityType, entityId, pagination = {}) {
    const { page, limit, offset } = parsePagination(pagination);
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${T} WHERE entity_type = $1 AND entity_id = $2`, [entityType, entityId]);
    const dataResult = await query(
      `SELECT * FROM ${T} WHERE entity_type = $1 AND entity_id = $2 ORDER BY changed_at DESC LIMIT $3 OFFSET $4`,
      [entityType, entityId, limit, offset]
    );
    return { rows: dataResult.rows, page, limit, total: countResult.rows[0].total };
  }
}

module.exports = new ClmClientStatusHistoryRepository();
