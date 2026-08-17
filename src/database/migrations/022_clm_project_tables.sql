-- ============================================================
-- 022: Client Management extension - Project + Project Cost Plan (architecture doc §6.1/§6.2)
--
-- clm_project is the hub every financial fact in this submodule hangs off
-- (doc's closing "Central-entity check"): client billing, procurement, and
-- vendor invoices/expenses (clm_client_invoice.project_id,
-- vnd_purchase_order.project_id, vnd_vendor_invoice.project_id,
-- clm_project_expense.project_id) all point at it.
--
-- NOT YET reconciled with the Commercial Lifecycle module's subcontract
-- chain: com_rfq.project_id / com_boq.project_id / com_po.project_id still
-- target the external `projects(id)` table as-is (004_rfq_tables.sql), the
-- same unresolved-FK-target pattern as clients/clm_client (see
-- 014_clm_client_tables.sql). Reconciling the two is out of scope here.
-- ============================================================

CREATE TABLE IF NOT EXISTS clm_project (
  project_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code               VARCHAR(30) NOT NULL UNIQUE,
  project_name                 VARCHAR(200) NOT NULL,
  client_id                      UUID NOT NULL REFERENCES clm_client(client_id) ON DELETE RESTRICT,
  requirement_id                   UUID REFERENCES clm_client_requirement(requirement_id),
  site_location                      VARCHAR(255) NOT NULL,
  description                         TEXT,
  start_date                            DATE,
  expected_completion_date                DATE,
  actual_completion_date                    DATE,
  contract_value                              NUMERIC(18,2) NOT NULL CHECK (contract_value >= 0),
  project_manager_id                            UUID REFERENCES employees(id),
  project_status                                  clm_project_status NOT NULL DEFAULT 'Planning',
  progress_percentage                               NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (progress_percentage BETWEEN 0 AND 100),
  remarks                                             TEXT,
  company_id                                            UUID NOT NULL REFERENCES companies(id),
  branch_id                                               UUID REFERENCES branches(id),
  created_at                                                TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                                                  UUID NOT NULL REFERENCES users(id),
  updated_at                                                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                                                      UUID REFERENCES users(id),
  deleted_at                                                        TIMESTAMPTZ,
  deleted_by                                                          UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_clmproject_client ON clm_project(client_id);
CREATE INDEX IF NOT EXISTS idx_clmproject_status ON clm_project(project_status);
CREATE INDEX IF NOT EXISTS idx_clmproject_name ON clm_project(project_name);

-- ---------- PROJECT COST PLAN ----------
-- No actual_cost column (doc §6.2 design note): always
-- SUM(clm_project_expense.amount) grouped by category - see v_project_cost_summary.
CREATE TABLE IF NOT EXISTS clm_project_cost (
  project_cost_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES clm_project(project_id) ON DELETE RESTRICT,
  cost_category        clm_cost_category NOT NULL,
  estimated_cost         NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  budgeted_cost            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (budgeted_cost >= 0),
  remarks                    TEXT,
  company_id                   UUID NOT NULL REFERENCES companies(id),
  branch_id                      UUID REFERENCES branches(id),
  created_at                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                         UUID NOT NULL REFERENCES users(id),
  updated_at                           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                             UUID REFERENCES users(id),
  UNIQUE (project_id, cost_category)
);
CREATE INDEX IF NOT EXISTS idx_clmprojectcost_project ON clm_project_cost(project_id);
