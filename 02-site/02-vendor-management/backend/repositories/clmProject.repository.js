'use strict';

const BaseRepository = require('../../../../shared/backend/repositories/base.repository');
const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

class ClmProjectRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_PROJECT.name, pk: TABLES.CLM_PROJECT.pk });
  }

  async findByCode(projectCode, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE project_code = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [projectCode, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new ClmProjectRepository();
