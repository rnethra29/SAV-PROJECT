-- ============================================================
-- 029: RBAC (architecture doc §14) - independent of everything else in this
-- module, can run any time relative to 021-028.
--
-- Classic RBAC: user -> sec_user_role -> sec_role -> sec_role_permission ->
-- sec_permission. Permissions are never hard-coded into business tables or
-- application `if` statements against a role name.
-- ============================================================

CREATE TABLE IF NOT EXISTS sec_role (
  role_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name    VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by          UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sec_permission (
  permission_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code VARCHAR(100) NOT NULL UNIQUE,   -- e.g. 'vnd_purchase_order.approve'
  module           VARCHAR(50) NOT NULL,           -- e.g. 'Vendors', 'ClientManagement'
  description        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sec_role_permission (
  role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id               UUID NOT NULL REFERENCES sec_role(role_id) ON DELETE RESTRICT,
  permission_id           UUID NOT NULL REFERENCES sec_permission(permission_id) ON DELETE RESTRICT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                  UUID NOT NULL REFERENCES users(id),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS sec_user_role (
  user_role_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role_id           UUID NOT NULL REFERENCES sec_role(role_id) ON DELETE RESTRICT,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by           UUID NOT NULL REFERENCES users(id),
  UNIQUE (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_sec_userrole_user ON sec_user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_sec_rolepermission_role ON sec_role_permission(role_id);
