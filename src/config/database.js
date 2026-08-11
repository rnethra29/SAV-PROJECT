'use strict';

const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

/**
 * Direct Postgres connection to the Supabase database.
 *
 * We use `pg` (not the supabase-js query builder) as the primary data-access
 * layer for this module because the business logic depends on:
 *  - multi-statement ACID transactions (versioning, negotiation settlement,
 *    BOQ generation, PO generation, actual-price pointer + history writes)
 *  - recursive CTEs (RFQ item / BOQ item hierarchy)
 *  - the read-only views defined in src/database/views
 *
 * `@supabase/supabase-js` (see supabase.js) is used only for Storage and
 * Auth JWT verification, per the architecture spec (Phase 12).
 */
const pool = new Pool({
  connectionString: env.database.url,
  max: env.database.poolMax,
  ssl: env.database.ssl ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle Postgres client', { error: err.message });
});

/**
 * Run a single query against the pool.
 * @param {string} text
 * @param {any[]} params
 */
async function query(text, params = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    logger.warn('Slow query', { text, duration, rows: result.rowCount });
  }
  return result;
}

/**
 * Run a callback inside a single transactional client. The callback
 * receives a `client` object with a `.query(text, params)` method bound
 * to that transaction. Commits on success, rolls back on any thrown error.
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      logger.error('Rollback failed', { error: rollbackErr.message });
    }
    throw err;
  } finally {
    client.release();
  }
}

async function checkConnection() {
  const result = await query('SELECT now() AS now');
  return result.rows[0].now;
}

module.exports = { pool, query, transaction, checkConnection };
