'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class ClmClientRequirementRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.CLM_CLIENT_REQUIREMENT.name, pk: TABLES.CLM_CLIENT_REQUIREMENT.pk });
  }

  async findByNumber(requirementNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE requirement_number = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [requirementNumber, companyId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new ClmClientRequirementRepository();
