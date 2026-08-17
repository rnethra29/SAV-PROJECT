'use strict';

const { query } = require('../../../../shared/backend/config/database');
const { TABLES } = require('../../../../shared/backend/models/tables');

/**
 * Shared data access for the Client Management submodule's three Lookup
 * tables (clm_client_type, clm_industry, clm_contact_type - architecture
 * doc §6.1/§6.2/§6.4 note). Company-agnostic shared master data, never
 * soft-deleted - `is_active` is the deactivation switch instead. Kept as its
 * own small class (rather than reusing src/repositories/lookup.repository.js)
 * since these tables carry the lighter `created_at`/`created_by`-only audit
 * set with no `updated_at` column at all, unlike two of that repository's
 * three tables.
 */
class ClmLookupRepository {
  /**
   * @param {{ name: string, pk: string }} table
   * @param {string} nameColumn
   */
  constructor(table, nameColumn) {
    this.table = table.name;
    this.pk = table.pk;
    this.nameColumn = nameColumn;
  }

  async findAll({ activeOnly = true } = {}) {
    const where = activeOnly ? 'WHERE is_active = true' : '';
    const result = await query(`SELECT * FROM ${this.table} ${where} ORDER BY ${this.nameColumn} ASC`);
    return result.rows;
  }

  async findById(id) {
    const result = await query(`SELECT * FROM ${this.table} WHERE ${this.pk} = $1`, [id]);
    return result.rows[0] || null;
  }

  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const result = await query(
      `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async update(id, data) {
    const columns = Object.keys(data);
    if (!columns.length) return this.findById(id);
    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);
    const values = Object.values(data);
    values.push(id);
    const result = await query(
      `UPDATE ${this.table} SET ${setClauses.join(', ')} WHERE ${this.pk} = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deactivate(id) {
    return this.update(id, { is_active: false });
  }
}

const clientTypeRepository = new ClmLookupRepository(TABLES.CLM_CLIENT_TYPE, 'type_name');
const industryRepository = new ClmLookupRepository(TABLES.CLM_INDUSTRY, 'industry_name');
const contactTypeRepository = new ClmLookupRepository(TABLES.CLM_CONTACT_TYPE, 'type_name');

module.exports = {
  ClmLookupRepository,
  clientTypeRepository,
  industryRepository,
  contactTypeRepository,
};
