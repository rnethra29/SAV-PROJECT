'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { pool, checkConnection } = require('./config/database');

let server;

async function start() {
  try {
    const now = await checkConnection();
    logger.info(`[db] Connected to Postgres - server time: ${now}`);
  } catch (err) {
    logger.error('[db] Failed to connect to Postgres on startup. Check DATABASE_URL in .env.', {
      error: err.message || err.code || String(err),
      code: err.code,
    });
    // Fail fast: this module is unusable without its database.
    process.exit(1);
  }

  server = app.listen(env.port, () => {
    logger.info(`SAV ERP Commercial Lifecycle Module API listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`API base: http://localhost:${env.port}${env.apiPrefix}`);
    logger.info(`Swagger docs: http://localhost:${env.port}/api-docs`);
  });
}

async function shutdown(signal) {
  logger.info(`[server] Received ${signal}, shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await pool.end();
      logger.info('[server] Closed remaining connections. Exiting.');
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.stack : reason });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.stack });
  process.exit(1);
});

start();
