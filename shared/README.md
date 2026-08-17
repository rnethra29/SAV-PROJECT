# shared

Backend infrastructure and cross-cutting engines used by every business module — moved here (rather than left inside whichever module happened to define it first) specifically so no module has to reach into another module's folder for things like the DB pool, auth middleware, or the documents/approvals/audit engine. Nothing in here is business-module-specific; if a file only serves one module, it belongs in that module's own folder, not here.

```
shared/
  backend/
    app.js, server.js              Express app assembly + process entry point
    config/                        env loader, Postgres pool, Supabase client, logger, swagger
    middlewares/                   auth (Supabase JWKS), role gating, Joi validation, error handling
    utils/                         ApiError, asyncHandler, response envelope, pagination/word-count helpers, jwt
    models/                        ENUM mirrors, table/view name constants, status state machines, approval stages
                                    — each file currently mixes constants for all business modules; kept as one
                                    file per the "move, don't rewrite" rule for this reorg. Splitting these per
                                    module is a real code change, proposed as optional follow-up, not done here.
    repositories/base.repository.js   generic CRUD extended by most module repositories
    validators/common.validator.js    uuid/idParam/paginationQuery schemas used by every module's own validators
    documents-approvals-audit/     the polymorphic com_documents / com_approvals / com_audit_log engine —
                                    reused by every module via entity_type, never duplicated per module
    database/                      migrate.js (scans every module's migrations/ folder, applies in filename
                                    order), seed.js, and the foundational migrations (001, 002, 010) that
                                    predate any one module owning them
    docs/                          api.md, swagger.json — reference for every module's endpoints
    tests/                         helpers.test.js, statusTransitions.test.js (mixes transition tests for
                                    every module in one file — see the reorg proposal for the split question)
  rbac/
    backend/                       sec_role / sec_permission / sec_role_permission / sec_user_role — applies to
                                    every module, so lives here rather than inside whichever module specified it
```

See the module-based reorganization proposal for the reasoning behind what landed here vs. inside a specific module.
