'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

/** No deleted_at column (doc §6.2 - CORE_NO_SOFT_DELETE) - a project's cost plan row is corrected in place, not soft-deleted (there's nothing sensitive/historical about a budget figure the way there is about a financial transaction). */
class ClmProjectCostRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_PROJECT_COST.name, pk: TABLES.CLM_PROJECT_COST.pk, softDelete: false });
  }

  async findByProjectId(projectId, { client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const result = await exec(`SELECT * FROM ${this.table} WHERE project_id = $1 ORDER BY cost_category ASC`, [projectId]);
    return result.rows;
  }

  async findByProjectAndCategory(projectId, costCategory, { excludeId, client } = {}) {
    const exec = client ? client.query.bind(client) : query;
    const params = [projectId, costCategory];
    let sql = `SELECT * FROM ${this.table} WHERE project_id = $1 AND cost_category = $2`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND project_cost_id <> $${params.length}`;
    }
    const result = await exec(sql, params);
    return result.rows[0] || null;
  }
}

module.exports = new ClmProjectCostRepository();
