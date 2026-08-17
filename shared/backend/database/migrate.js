'use strict';

/**
 * Minimal, dependency-free migration runner for the whole SAV ERP backend.
 *
 * Usage:
 *   npm run migrate         (applies every *.sql file across every module's
 *                            migrations/ folder not yet recorded, sorted by
 *                            filename across the combined set)
 *   npm run migrate:down    (prints a warning - see note below)
 *
 * Migration files live next to the module they belong to (module-based
 * reorg), not in one flat directory - but their numeric filename prefixes
 * (001-030) still encode one single, real cross-module dependency order
 * (e.g. Client Management's 012-019 reference tables Commercial Lifecycle's
 * 003-011 already created; Vendor Management's 020-030 reference both).
 * Gathering every directory's files into one list and sorting that combined
 * list by filename - rather than draining one directory before moving to
 * the next - reproduces the exact original apply order regardless of which
 * module folder a given file physically lives in.
 *
 * Each migration file is wrapped in its own transaction and recorded in
 * `com_schema_migrations` (by filename only, so it stays unique and stable
 * even though the file's directory changed in this reorg). Migrations are
 * idempotent (CREATE TABLE/TYPE/INDEX ... IF NOT EXISTS, DO $$ ... EXCEPTION
 * WHEN duplicate_object) so re-running is safe, but the tracking table still
 * avoids needless re-execution.
 *
 * No down-migrations are provided by design: this project's own convention
 * ("never hard-delete") extends to the schema itself - destructive
 * rollbacks should be reviewed and run by hand against a specific
 * environment, not scripted generically.
 */

const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/database');
const logger = require('../config/logger');

// One entry per module that owns its own migrations/ folder, in the order
// they were introduced - purely documentary, since the actual apply order
// below is driven by sorting the combined file list by filename, not by
// this array's order.
const MIGRATIONS_DIRS = [
  path.join(__dirname, 'migrations'), // shared/backend - foundational enums (001,002) + cross-module documents/approvals/audit engine (010)
  path.join(__dirname, '..', '..', '..', '01-commercial-lifecycle', 'backend', 'database', 'migrations'),
  path.join(__dirname, '..', '..', '..', '02-site', '01-client-management', 'backend', 'database', 'migrations'),
  path.join(__dirname, '..', '..', '..', '02-site', '02-vendor-management', 'backend', 'database', 'migrations'),
  path.join(__dirname, '..', '..', 'rbac', 'backend', 'database', 'migrations'),
];

function collectMigrationFiles() {
  const files = [];
  for (const dir of MIGRATIONS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const filename of fs.readdirSync(dir)) {
      if (filename.endsWith('.sql')) files.push({ filename, fullPath: path.join(dir, filename) });
    }
  }
  files.sort((a, b) => a.filename.localeCompare(b.filename));
  return files;
}

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

  const files = collectMigrationFiles();

  let ranCount = 0;
  for (const { filename, fullPath } of files) {
    if (applied.has(filename)) {
      logger.info(`[migrate] skip (already applied): ${filename}`);
      continue;
    }

    const sql = fs.readFileSync(fullPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO com_schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      logger.info(`[migrate] applied: ${filename}`);
      ranCount += 1;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`[migrate] FAILED: ${filename}`, { error: err.message });
      throw err;
    } finally {
      client.release();
    }
  }

  logger.info(`[migrate] done - ${ranCount} migration(s) applied, ${files.length - ranCount} already up to date.`);
}

async function down() {
  logger.warn(
    '[migrate] No automated down-migrations are provided (see this file\'s header comment). ' +
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
