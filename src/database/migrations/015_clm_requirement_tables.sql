-- ============================================================
-- 015: Client Management - Client Requirements (pre-RFQ capture, architecture doc §6.6)
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_client_requirement (
  requirement_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_number           VARCHAR(50) NOT NULL UNIQUE,
  client_id                       UUID NOT NULL REFERENCES clm_client(client_id) ON DELETE RESTRICT,
  project_id                         UUID REFERENCES projects(id),
  requirement_title                     VARCHAR(200) NOT NULL,
  requirement_description                  TEXT,
  received_date                              DATE NOT NULL,
  required_completion_date                     DATE,
  priority                                       clm_requirement_priority NOT NULL DEFAULT 'Medium',
  requirement_status                               clm_requirement_status NOT NULL DEFAULT 'New',
  assigned_employee_id                               UUID REFERENCES employees(id),
  notes                                                TEXT,
  company_id                                             UUID NOT NULL REFERENCES companies(id),
  branch_id                                                UUID REFERENCES branches(id),
  created_at                                                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                   UUID NOT NULL REFERENCES users(id),
  updated_at                                                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                       UUID REFERENCES users(id),
  deleted_at                                                         TIMESTAMPTZ,
  deleted_by                                                           UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clm_requirement_client ON clm_client_requirement(client_id);
CREATE INDEX IF NOT EXISTS idx_clm_requirement_status ON clm_client_requirement(requirement_status);

-- Cross-reference (doc escalation #4, back-fill recommended on the Commercial
-- Lifecycle module's own migrations - not applied here):
--   ALTER TABLE com_rfq ADD COLUMN requirement_id UUID REFERENCES clm_client_requirement(requirement_id);
