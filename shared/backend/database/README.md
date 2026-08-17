# Database layer

Migrations and seeds now live next to the module they belong to (module-based reorg), not in one flat directory — but `migrate.js`/`seed.js` (this folder) remain the single shared entry point that knows about every module's `database/` folder, so `npm run migrate`/`npm run seed` still behave as one command regardless of where a given file physically lives.

- **`migrate.js`** — gathers `*.sql` from every module's `migrations/` folder (see `MIGRATIONS_DIRS` at the top of the file), sorts the *combined* list by filename, and applies whatever isn't yet recorded in `com_schema_migrations`. Sorting the combined list (rather than draining one directory before moving to the next) reproduces the original single global apply order — the numeric filename prefixes 001–030 encode a real cross-module dependency chain, not just a per-module one:
  - `shared/backend/database/migrations/001,002`: foundational ENUMs + helper functions, needed by every module.
  - `01-commercial-lifecycle/backend/database/migrations/003–009,011`: Commercial Lifecycle (`com_*`) tables + views.
  - `shared/backend/database/migrations/010`: the polymorphic Documents/Approvals/Audit Log engine — reused by every module, not owned by Commercial Lifecycle even though its number falls inside that module's own range.
  - `02-site/01-client-management/backend/database/migrations/012–019`: Client Management (`clm_client*`/`clm_payment*`).
  - `02-site/02-vendor-management/backend/database/migrations/020–028,030`: Vendor Management & Procurement (`vnd_*`, `clm_project*`).
  - `shared/rbac/backend/database/migrations/029`: RBAC (`sec_*`) — applies to every module, not owned by Vendor Management even though its number falls inside that module's own range.
- **`seed.js`** — same shared-entry-point pattern: requires each module's own `database/seeds/*.js` data file and seeds every lookup table + baseline RBAC in one run.
- Each module's own `README.md`/`ARCHITECTURE.md` documents that module's specific tables, views, and triggers in full — this file only covers the cross-module orchestration layer.

## Setup

1. Fill in `.env` (see `.env.example`) with your Supabase project's `DATABASE_URL` (direct/session Postgres connection string), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`.
2. `npm run migrate` — creates every enum/table/index/function/trigger/view across every module.
3. `npm run seed` — populates every lookup table plus baseline RBAC (requires at least one row in the external `users` table, or set `SEED_USER_ID`).

External master tables (`companies`, `branches`, `users`, `employees`, `clients`, `sites`, `currencies`, `taxes`) are **not** created by these migrations — they belong to the future Auth/RBAC/Organization foundation (`apps/api`) and are referenced by FK only. (`vendors` and `projects` *are* created here already, as `vnd_vendor` and `clm_project`.) Two FK-target reconciliations are still open, both flagged in-line in the relevant migration file's header comment:
- `clm_client` (Client Management) vs. the external `clients` table `com_rfq`/`com_boq` FK to — see the escalation notes at the top of `02-site/01-client-management/ARCHITECTURE.md`.
- `clm_project` (Vendor Management & Procurement) vs. the external `projects` table `com_rfq`/`com_boq`/`com_po` FK to — see `02-site/02-vendor-management/backend/database/migrations/022_clm_project_tables.sql`'s header comment and `02-site/02-vendor-management/ARCHITECTURE.md` §0.
