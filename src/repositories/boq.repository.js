'use strict';

const BaseRepository = require('./base.repository');
const { query } = require('../config/database');
const { TABLES } = require('../models/tables');

class BoqRepository extends BaseRepository {
  constructor() {
    super({ table: TABLES.BOQ.name, pk: TABLES.BOQ.pk });
  }

  async findVersionsByNumber(boqNumber, companyId) {
    const result = await query(
      `SELECT * FROM ${this.table} WHERE boq_number = $1 AND company_id = $2 AND deleted_at IS NULL ORDER BY version_no ASC`,
      [boqNumber, companyId]
    );
    return result.rows;
  }

  async hasNewerVersion(boqId) {
    const result = await query(`SELECT 1 FROM ${this.table} WHERE previous_version_id = $1 AND deleted_at IS NULL LIMIT 1`, [boqId]);
    return result.rowCount > 0;
  }
}

module.exports = new BoqRepository();
