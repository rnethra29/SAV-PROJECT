-- ============================================================
-- 010: Documents (polymorphic, Supabase Storage) + Approvals (polymorphic) + Audit Log (immutable, polymorphic)
-- ============================================================

CREATE TABLE IF NOT EXISTS com_documents (
  document_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type            com_document_entity_type NOT NULL,
  entity_id                UUID NOT NULL,
  document_category_id      UUID NOT NULL REFERENCES com_document_category(document_category_id),
  file_name                   VARCHAR(255) NOT NULL,
  file_type                     VARCHAR(50) NOT NULL,
  mime_type                       VARCHAR(100) NOT NULL,
  file_size_bytes                   BIGINT NOT NULL,
  storage_bucket                      VARCHAR(100) NOT NULL,
  storage_path                          VARCHAR(500) NOT NULL UNIQUE,
  version_no                              INTEGER NOT NULL DEFAULT 1 CHECK (version_no >= 1),
  previous_version_id                       UUID REFERENCES com_documents(document_id),
  status                                      com_document_status NOT NULL DEFAULT 'Active',
  description                                   TEXT,
  company_id                                      UUID NOT NULL REFERENCES companies(id),
  branch_id                                         UUID REFERENCES branches(id),
  created_at                                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                            UUID NOT NULL REFERENCES users(id),
  updated_at                                              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_com_documents_entity ON com_documents(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS com_approvals (
  approval_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type          com_approval_entity_type NOT NULL,
  entity_id              UUID NOT NULL,
  approval_stage           VARCHAR(50) NOT NULL,
  approver_id                UUID NOT NULL REFERENCES users(id),
  status                       com_approval_status NOT NULL DEFAULT 'Pending',
  approved_at                    TIMESTAMPTZ,
  comments                         TEXT,
  rejection_reason                   TEXT,
  company_id                           UUID NOT NULL REFERENCES companies(id),
  branch_id                              UUID REFERENCES branches(id),
  created_at                               TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                 UUID NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_com_approvals_entity ON com_approvals(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS com_audit_log (
  audit_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      VARCHAR(50) NOT NULL,
  entity_id          UUID NOT NULL,
  action               com_audit_action NOT NULL,
  user_id                UUID NOT NULL REFERENCES users(id),
  old_value                JSONB,
  new_value                  JSONB,
  performed_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_com_auditlog_entity ON com_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_com_auditlog_time ON com_audit_log(performed_at);
