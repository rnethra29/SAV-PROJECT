'use strict';

const { query } = require('../config/database');
const { TABLES } = require('../models/tables');
const { parsePagination } = require('../utils/helpers');

const T = TABLES.AUDIT_LOG.name;

class AuditLogRepository {
  /**
   * @param {{ entity_type: string, entity_id: string, action: string, user_id: string, old_value?: object, new_value?: object }} entry
   * @param {import('pg').PoolClient} [client]
   */
  async record(entry, client) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(
      `INSERT INTO ${T} (entity_type, entity_id, action, user_id, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        entry.entity_type,
        entry.entity_id,
        entry.action,
        entry.user_id,
        entry.old_value ? JSON.stringify(entry.old_value) : null,
        entry.new_value ? JSON.stringify(entry.new_value) : null,
      ]
    );
    return result.rows[0];
  }

  async findByEntity(entityType, entityId, pagination = {}) {
    const { page, limit, offset } = parsePagination(pagination);
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${T} WHERE entity_type = $1 AND entity_id = $2`, [entityType, entityId]);
    const dataResult = await query(
      `SELECT * FROM ${T} WHERE entity_type = $1 AND entity_id = $2 ORDER BY performed_at DESC LIMIT $3 OFFSET $4`,
      [entityType, entityId, limit, offset]
    );
    return { rows: dataResult.rows, page, limit, total: countResult.rows[0].total };
  }
}

module.exports = new AuditLogRepository();
