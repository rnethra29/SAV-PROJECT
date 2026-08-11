# Database layer

- **`migrations/`** — canonical, ordered, applied by `npm run migrate` (see `migrate.js`). This is the single source of truth for schema, functions, triggers and views. Files are idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE` / duplicate-object-safe `DO $$` blocks) so re-running is always safe.
- **`functions/`**, **`views/`**, **`schema/`** — kept as thin pointers (below) rather than duplicated copies of the SQL in `migrations/`, to avoid the two drifting apart. Open the referenced migration file directly to read/edit the actual definition.
  - Helper functions & triggers → `migrations/002_helper_functions.sql`, `migrations/008_boq_tables.sql` (word-count trigger)
  - Views → `migrations/011_views.sql` (`v_estimation_item_cost`, `v_item_commercial_analysis`, `v_item_commercial_analysis_final`)
  - Full table DDL → `migrations/003_*.sql` through `010_*.sql`
- **`seeds/`** — static seed data (`001_lookup_data.js`) applied by `npm run seed` (see `seed.js`) for the three Lookup tables (`com_item_category`, `com_price_source_type`, `com_document_category`).

## Setup

1. Fill in `.env` (see `.env.example`) with your Supabase project's `DATABASE_URL` (direct/session Postgres connection string), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`.
2. `npm run migrate` — creates every enum/table/index/function/trigger/view.
3. `npm run seed` — populates the lookup tables (requires at least one row in the external `users` table, or set `SEED_USER_ID`).

External master tables (`companies`, `branches`, `users`, `clients`, `projects`, `sites`, `vendors`, `currencies`, `taxes`) are **not** created by these migrations — they belong to other SAV ERP modules and are referenced by FK only, per the architecture spec (Phase 1.6).
