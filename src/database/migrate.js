'use strict';

/**
 * Minimal, dependency-free migration runner for this module.
 *
 * Usage:
 *   npm run migrate         (applies every *.sql file in ./migrations not yet recorded, in filename order)
 *   npm run migrate:down    (prints a warning - see note below)
 *
 * Each migration file is wrapped in its own transaction and recorded in
 * `com_schema_migrations` on success. Migrations are idempotent (CREATE
 * TABLE/TYPE/INDEX ... IF NOT EXISTS, DO $$ ... EXCEPTION WHEN
 * duplicate_object) so re-running is safe, but the tracking table still
 * avoids needless re-execution.
 *
 * No down-migrations are provided by design: this module's own convention
 * (architecture Phase 1 "never hard-delete") extends to the schema itself -
 * destructive rollbacks should be reviewed and run by hand against a
 * specific environment, not scripted generically.
 */

const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/database');
const logger = require('../config/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS com_schema_migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations() {
  const result = await query('SELECT filename FROM com_schema_migrations');
  return new Set(result.rows.map((r) => r.filename));
}

async function up() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranCount = 0;
  for (const file of files) {
    if (applied.has(file)) {
      logger.info(`[migrate] skip (already applied): ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO com_schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info(`[migrate] applied: ${file}`);
      ranCount += 1;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`[migrate] FAILED: ${file}`, { error: err.message });
      throw err;
    } finally {
      client.release();
    }
  }

  logger.info(`[migrate] done - ${ranCount} migration(s) applied, ${files.length - ranCount} already up to date.`);
}

async function down() {
  logger.warn(
    '[migrate] No automated down-migrations are provided for this module (see src/database/migrate.js header comment). ' +
    'Roll back manually and review data-loss implications for versioned/append-only tables before dropping anything.'
  );
}

async function main() {
  const cmd = process.argv[2] || 'up';
  try {
    if (cmd === 'up') await up();
    else if (cmd === 'down') await down();
    else {
      logger.error(`[migrate] Unknown command: ${cmd}. Use "up" or "down".`);
      process.exitCode = 1;
    }
  } catch (err) {
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { up, down };
