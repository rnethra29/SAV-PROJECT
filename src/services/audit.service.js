'use strict';

const auditLogRepository = require('../repositories/auditLog.repository');
const logger = require('../config/logger');

/**
 * Application-layer audit writer (architecture Phase 12: "every write to a
 * com_* table should also insert into com_audit_log ... via application-
 * layer transaction"). Every service in this module calls `log()` inside
 * the same DB transaction as the write it is auditing, so the audit row is
 * atomic with the change it describes - never a separate best-effort call.
 *
 * Deliberately swallow-and-log rather than throw when `client` is omitted
 * (fire-and-forget outside a transaction) so a logging hiccup never blocks
 * the primary business operation; callers that pass `client` get full
 * atomicity and any failure there rolls back with the rest of the transaction.
 */
async function log({ entityType, entityId, action, userId, oldValue, newValue }, client) {
  const entry = { entity_type: entityType, entity_id: entityId, action, user_id: userId, old_value: oldValue, new_value: newValue };
  if (client) {
    return auditLogRepository.record(entry, client);
  }
  try {
    return await auditLogRepository.record(entry);
  } catch (err) {
    logger.error('[audit] failed to record audit entry outside transaction', { entry, error: err.message });
    return null;
  }
}

async function history(entityType, entityId, pagination) {
  return auditLogRepository.findByEntity(entityType, entityId, pagination);
}

module.exports = { log, history };
