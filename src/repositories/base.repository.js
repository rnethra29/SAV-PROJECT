'use strict';

const { pool, query: poolQuery } = require('../config/database');
const { parsePagination, parseSortColumn, parseSortDir } = require('../utils/helpers');

/**
 * Generic data-access layer for tables following the module's standing
 * "CORE" audit convention (architecture Phase 5 legend): company_id +
 * (optional) branch_id scoping, created_* / updated_* / [deleted_*] audit
 * columns. Covers com_rfq, com_rfq_items, com_estimation,
 * com_estimation_items, com_quotation, com_quotation_items, com_boq,
 * com_boq_items, com_po, com_po_items as-is, and com_actual_price /
 * com_documents via `{ softDelete: false }`.
 *
 * Entity repositories extend this for the common CRUD surface and add
 * hand-written methods for anything table-specific (hierarchy traversal,
 * versioning, 1:1 lookups, etc).
 */
class BaseRepository {
  /**
   * @param {object} opts
   * @param {string} opts.table
   * @param {string} opts.pk
   * @param {boolean} [opts.softDelete=true]
   */
  constructor({ table, pk, softDelete = true }) {
    this.table = table;
    this.pk = pk;
    this.softDelete = softDelete;
  }

  _exec(client) {
    return client ? client.query.bind(client) : poolQuery;
  }

  _notDeletedClause(alias = '') {
    if (!this.softDelete) return '';
    const prefix = alias ? `${alias}.` : '';
    return ` AND ${prefix}deleted_at IS NULL`;
  }

  /**
   * @param {string} id
   * @param {{ companyId?: string, client?: import('pg').PoolClient }} [opts]
   */
  async findById(id, { companyId, client } = {}) {
    const exec = this._exec(client);
    const params = [id];
    let sql = `SELECT * FROM ${this.table} WHERE ${this.pk} = $1`;
    if (companyId) {
      params.push(companyId);
      sql += ` AND company_id = $${params.length}`;
    }
    sql += this._notDeletedClause();
    const result = await exec(sql, params);
    return result.rows[0] || null;
  }

  /**
   * @param {object} opts
   * @param {string} [opts.companyId]
   * @param {Record<string, any>} [opts.filters] exact-match equality filters
   * @param {string[]} [opts.allowedSort] whitelist for orderBy
   * @param {string} [opts.defaultSort]
   * @param {import('express').Request['query']} [opts.pagination] raw req.query
   * @param {import('pg').PoolClient} [opts.client]
   */
  async findAll({ companyId, filters = {}, allowedSort = [this.pk], defaultSort = this.pk, pagination = {}, client } = {}) {
    const exec = this._exec(client);
    const { page, limit, offset } = parsePagination(pagination);
    const sortCol = parseSortColumn(pagination.sortBy, allowedSort, defaultSort);
    const sortDir = parseSortDir(pagination.sortDir);

    const whereClauses = [];
    const params = [];

    if (companyId) {
      params.push(companyId);
      whereClauses.push(`company_id = $${params.length}`);
    }
    for (const [col, val] of Object.entries(filters)) {
      if (val === undefined || val === null) continue;
      params.push(val);
      whereClauses.push(`${col} = $${params.length}`);
    }
    if (this.softDelete) whereClauses.push('deleted_at IS NULL');

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await exec(`SELECT COUNT(*)::int AS total FROM ${this.table} ${whereSql}`, params);
    const total = countResult.rows[0].total;

    params.push(limit, offset);
    const dataResult = await exec(
      `SELECT * FROM ${this.table} ${whereSql} ORDER BY ${sortCol} ${sortDir} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { rows: dataResult.rows, page, limit, total };
  }

  /**
   * @param {Record<string, any>} data column -> value map
   * @param {{ client?: import('pg').PoolClient }} [opts]
   */
  async create(data, { client } = {}) {
    const exec = this._exec(client);
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const result = await exec(sql, values);
    return result.rows[0];
  }

  /**
   * @param {string} id
   * @param {Record<string, any>} data column -> value map (updated_at/updated_by handled automatically)
   * @param {{ companyId?: string, userId?: string, client?: import('pg').PoolClient }} [opts]
   */
  async update(id, data, { companyId, userId, client } = {}) {
    const exec = this._exec(client);
    const columns = Object.keys(data);
    if (!columns.length) return this.findById(id, { companyId, client });

    const setClauses = columns.map((col, i) => `${col} = $${i + 1}`);
    const values = Object.values(data);

    setClauses.push(`updated_at = now()`);
    if (userId) {
      values.push(userId);
      setClauses.push(`updated_by = $${values.length}`);
    }

    values.push(id);
    let sql = `UPDATE ${this.table} SET ${setClauses.join(', ')} WHERE ${this.pk} = $${values.length}`;
    if (companyId) {
      values.push(companyId);
      sql += ` AND company_id = $${values.length}`;
    }
    sql += this._notDeletedClause();
    sql += ' RETURNING *';

    const result = await exec(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Soft-delete (architecture Phase 1 rule: never hard-delete). No-op /
   * throws for tables where softDelete=false - callers should not call this.
   * @param {string} id
   * @param {{ companyId?: string, userId: string, client?: import('pg').PoolClient }} opts
   */
  async softDeleteById(id, { companyId, userId, client } = {}) {
    if (!this.softDelete) {
      throw new Error(`${this.table} does not support soft-delete via BaseRepository`);
    }
    const exec = this._exec(client);
    const values = [userId, id];
    let sql = `UPDATE ${this.table} SET deleted_at = now(), deleted_by = $1 WHERE ${this.pk} = $2 AND deleted_at IS NULL`;
    if (companyId) {
      values.push(companyId);
      sql += ` AND company_id = $${values.length}`;
    }
    sql += ' RETURNING *';
    const result = await exec(sql, values);
    return result.rows[0] || null;
  }
}

module.exports = BaseRepository;
