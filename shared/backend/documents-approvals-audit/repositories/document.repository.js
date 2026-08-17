'use strict';

const BaseRepository = require('../../repositories/base.repository');
const { query } = require('../../config/database');
const { TABLES } = require('../../models/tables');

class DocumentRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.DOCUMENTS.name, pk: TABLES.DOCUMENTS.pk, softDelete: false });
  }

  async findByEntity(entityType, entityId, { activeOnly = true } = {}) {
    const params = [entityType, entityId];
    let sql = `SELECT * FROM ${this.table} WHERE entity_type = $1 AND entity_id = $2`;
    if (activeOnly) sql += ` AND status = 'Active'`;
    sql += ' ORDER BY version_no DESC, created_at DESC';
    const result = await query(sql, params);
    return result.rows;
  }

  async findChildVersion(documentId) {
    const result = await query(`SELECT * FROM ${this.table} WHERE previous_version_id = $1 LIMIT 1`, [documentId]);
    return result.rows[0] || null;
  }
}

module.exports = new DocumentRepository();
