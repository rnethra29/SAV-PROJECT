# 02 — Site

Site/project-related operations. Ten sub-modules are planned; only the first three currently have any code or structural placeholder — the rest are intentionally absent rather than guessed at (no evidence for them exists anywhere in the codebase, database, or docs).

| # | Sub-module | Status |
|---|---|---|
| 01 | [`client-management`](01-client-management/) | Backend complete, frontend pending |
| 02 | [`vendor-management`](02-vendor-management/) | Backend complete, frontend pending |
| 03 | [`subcontractor-management`](03-subcontractor-management/) | Not started |
| 04–10 | — | Not yet named — add here once specified |

## Shared with the rest of the ERP

Documents, Approvals, Audit Log, and RBAC are used by every Site sub-module but are **not** duplicated per sub-module — see `shared/backend/documents-approvals-audit/` and `shared/rbac/`.
