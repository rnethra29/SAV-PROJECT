-- ============================================================
-- 018: Client Management - Status History (append-only, polymorphic - architecture doc §6.11)
--
-- Only tracks status transitions for entities this module owns
-- (ClientRequirement, ClientInvoice). RFQ/BOQ/PO status transitions stay
-- inside the Commercial Lifecycle module's own status ENUM + com_audit_log.
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_client_status_history (
  status_history_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type            clm_status_entity_type NOT NULL,
  entity_id                  UUID NOT NULL,
  old_status                    VARCHAR(50),
  new_status                       VARCHAR(50) NOT NULL,
  changed_by                          UUID NOT NULL REFERENCES users(id),
  changed_at                             TIMESTAMPTZ NOT NULL DEFAULT now(),
  remarks                                   TEXT
);
CREATE INDEX IF NOT EXISTS idx_clm_statushist_entity ON clm_client_status_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_clm_statushist_time ON clm_client_status_history(changed_at);
