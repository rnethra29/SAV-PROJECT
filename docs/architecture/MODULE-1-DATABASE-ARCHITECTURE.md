# MODULE 1 — Database Architecture Proposal

**Status:** DRAFT — awaiting approval. No `schema.prisma`, no migration, no database connection has been created from this document.

**Scope:** Authentication + RBAC + Organization / Branch / Project / Department foundation, as defined in `SAV-ERP-PROJECT-CONTEXT.md` Section F. Nothing beyond that scope is designed here.

**Source of truth:** `SAV-ERP-PROJECT-CONTEXT.md` (referenced below as "the context doc"). Every requirement below is tagged:

- **[APPROVED]** — taken directly from the context doc, not reinterpreted.
- **[DESIGN PROPOSAL]** — my proposed way to satisfy an approved requirement, where the context doc approves the *need* but not the exact shape.
- **[REQUIRES DECISION]** — the context doc does not specify enough to proceed silently. I have not decided these. They are listed again in full in Section E at the end.

---

## 1. Organization structure

**[APPROVED]** Single `Organization` record in V1 (SAV Wind Foundations). Multi-organization support must not require schema redesign later (B.3). Company profile fields — legal name, logo, GSTIN, PAN, registered address, contact info, financial year, company settings — live once at the Organization level and are referenced everywhere (B.2, F.1).

**[DESIGN PROPOSAL]** Every tenant-scoped table (branches, departments, projects, users, roles, access_grants, audit_logs, setup progress) carries an `organization_id` foreign key, even though V1 has exactly one row in `organizations`. This is what makes B.3's "no redesign later" guarantee real — it's cheap now and expensive to retrofit later.

## 2. Branch structure

**[APPROVED]** Branches belong to an Organization. Branches have code, address, contact details, branch manager, activation/deactivation (F.2). Branches have users assigned via `access_grants` and projects via `projects.branch_id` (B.3, F.2).

**[REQUIRES DECISION]** Business rule for deactivating/archiving a branch that still has active projects or users granted access to it — block, cascade-warn, or allow silently? Not specified.

## 3. Department model

**[APPROVED]** Simple department master (Finance, HR, Procurement, Operations, …) assigned to users. **Department is explicitly NOT part of the access-control hierarchy** — it is a descriptive/reporting attribute only, never used to grant or restrict data access (Section C, F.3). This is enforced structurally below: `departments` has no relationship whatsoever to `access_grants`, `roles`, or `permissions`.

## 4. Project structure

**[APPROVED]** Projects belong to a Branch (`projects.branch_id`, B.3, F.2). Projects are one of the two grantable access scopes (branch, project) via `access_grants` (B.3).

**[DESIGN PROPOSAL]** For Module 1, `projects` is deliberately a **minimal master record** — just enough to exist as an access-grant scope target and to belong to a branch. Full project attributes (dates, budget, status workflow, BOQ linkage, etc.) belong to the future Project Management module (F.9, G) and are not designed here.

**[REQUIRES DECISION]** Whether `projects` should also carry a denormalized `organization_id` (in addition to `branch_id`) for query/RLS convenience, vs. always joining through `branches`. See Section 20.

## 5. User structure

**[APPROVED]** Fields: Employee ID, name, email, phone, profile, department, designation, role, branch assignment(s), project assignment(s), status, joining date, last login, activation status (F.4). No employee record is created via any public flow — only by an Administrator or the bootstrap script (F.4, F.5, F.6). Branch/project assignment is **not** stored on the user directly — it flows entirely through `access_grants` (B.3), so there is exactly one access model, not two competing ones.

**[REQUIRES DECISION]** How `users` relates to Supabase Auth's own `auth.users` table. The context doc says Auth is "infrastructure-level" via Supabase (B.1) but doesn't specify the join. My proposal (below) is `users.id` = `auth.users.id` (shared UUID), with no password material ever stored in our schema — but this is a proposal, not something the context doc states outright.

**[REQUIRES DECISION]** Whether "Designation" (F.4) needs its own master table (like Department) or stays free text. Not specified — proposed as free text for Module 1, revisitable.

## 6. Role structure

**[APPROVED]** Roles are collections of permissions, not hardcoded logic. V1 baseline list of 14 roles is explicitly "not a fixed final list" — new/custom roles must be addable without code changes (F.7).

**[DESIGN PROPOSAL]** Because custom roles must be addable per the above, and because Organization is the tenant boundary (B.3), `roles` is organization-scoped (`organization_id` FK) rather than global. The 14 baseline roles are seeded per-organization at Organization creation, flagged `is_system_role = true` to distinguish platform-provided roles from an Administrator's custom additions.

## 7. Permission structure

**[APPROVED]** Fixed action vocabulary: View, Create, Edit, Delete, Approve, Reject, Import, Export, Generate Report, Configure (F.7, Section C).

**[REQUIRES DECISION] — significant.** The context doc gives the *action* dimension of a permission but never states the *resource/module* dimension. "Create" alone is not a usable permission — Create *what*? A role needs "Create Users" independently of "Create Branches." I have proposed a `(module, action)` pair as the permission unit (Section D catalog below), scoped for Module 1 to: `organization`, `branch`, `department`, `project`, `user`, `role`, `permission`, `access_grant`, `company_setup`. This resource list is **my proposal**, not something named in the context doc, and needs your explicit approval before it becomes the permission catalog.

**[REQUIRES DECISION]** Is the permission catalog itself fixed (seeded by migration, not editable at runtime) or can Administrators define new permissions through the "Configure" action? I've proposed **fixed/seeded catalog, dynamic role↔permission assignment only** — this matches "roles... assignable" language in F.7, which talks about assigning existing permissions to roles, not creating new permissions.

## 8. Role-permission relationships

**[APPROVED]** Roles are collections of permissions (F.7) — implies a many-to-many relationship. Modeled as join table `role_permissions` (Section D).

## 9. User access/scope relationships

**[APPROVED]** `access_grants` table: `user_id`, `scope_type: 'branch' | 'project'`, `scope_id`. A branch-level grant implies access to every project under that branch, including ones created later. `is_org_admin = true` users bypass scope checks entirely (B.3).

**[REQUIRES DECISION]** The context doc names the columns literally as `scope_type` / `scope_id` (a polymorphic reference — no real foreign key possible on `scope_id` since it can point at two different tables). I propose instead two nullable FK columns (`branch_id`, `project_id`) with a `CHECK` constraint enforcing exactly one is set, which gets you a real, DB-enforced foreign key instead of an application-trusted polymorphic pointer. This is a **deviation from the literal column shape approved in B.3**, so I'm flagging it rather than silently substituting it — see Section 20 and Section E.

## 10. Project/branch access rules

**[APPROVED]** Branch-level grant ⇒ implied access to all current and future projects under that branch. Org-admin bypasses scope checks entirely. Access scope = Organization / Branch / Project / Role / Permission (F.7, Section C). This is evaluated in the **Application RBAC layer**, before any Prisma query executes (B.4) — the database does not decide "does this branch grant imply this project," the backend does, by resolving branch→projects at query-scope-building time.

## 11. Authentication-related persistence requirements

**[APPROVED]** Login, logout, forgot/reset/change password, secure session management, account activation/deactivation (soft), invitation-based onboarding only, no public signup at all (F.5).

**[DESIGN PROPOSAL]** Since Supabase Auth is the approved auth infrastructure (B.1), password hashes, reset tokens, and session/JWT material are **not duplicated in our schema** — Supabase owns that. Our schema stores only what the business layer needs: `users.status`, `users.last_login_at`, and audit trail of auth events (`audit_logs`). No local `password_reset_tokens` or `sessions` table is proposed unless Supabase's built-in mechanisms prove insufficient.

**[REQUIRES DECISION]** Does the backend need its own session-revocation table (e.g., to force-logout a deactivated user immediately rather than waiting for JWT expiry)? Not specified in the context doc — flagged, not decided.

## 12. Setup Wizard persistence

**[APPROVED]** Shown once, to bootstrap Administrator/MD only. Steps: Company Information → Company Logo → Branches → Departments → Employees → Approval Configuration → Document Templates → Invite Users. Dismissible, not blocking, resumable. Fields named explicitly: `setup_completed`, `setup_percentage`, `completed_steps`, `remaining_steps`, `completed_at`, `completed_by` (F.8).

**[REQUIRES DECISION] — contradiction in the source doc.** F.8 lists **8** named steps but the persistent banner text is written as "X of **7** steps remaining." I cannot silently pick 7 or 8 — this needs to be resolved before the step enum is finalized.

**[REQUIRES DECISION]** Two of the eight steps — Approval Configuration and Document Templates — reference systems (Approval Engine, Document Generator) that F.9 explicitly defers to future modules. For Module 1, does the wizard step merely record "acknowledged/completed" without any real underlying configuration schema (since that schema doesn't exist yet), or does it stay disabled/hidden until those modules exist? Not specified.

## 13. Audit/security requirements relevant to Module 1

**[APPROVED]** Every module should support "audit log" as a shared, centrally-designed capability, not reimplemented per module (Section A, G). Deactivation must keep history "intact and attributable" (F.5). Frontend hides UI for usability; backend independently enforces every permission on every request (Section C) — implying every authorization decision is a candidate audit event.

**[DESIGN PROPOSAL]** A single append-only `audit_logs` table, generically shaped (polymorphic `entity_type`/`entity_id`, before/after JSON) so future modules reuse the same table per G's "designed once, centrally" principle — but for Module 1, only populated for auth/RBAC-relevant events (login success/failure, user created/deactivated, role changed, permission granted/revoked, access grant created/revoked, org-admin flag changed). Full audit coverage of business-transaction modules is out of scope here.

**[REQUIRES DECISION]** Retention policy for audit logs — not specified anywhere in the context doc.

## 14. Required indexes

Covered per-entity in Section D. Summary of the load-bearing ones: every `organization_id` FK column (tenant filtering is on the hot path of literally every query per B.4's chain), `users.email`, `users.role_id`, `access_grants(user_id)`, `access_grants(scope_type, branch_id, project_id)`, `role_permissions(role_id)`, `audit_logs(organization_id, created_at)`, `audit_logs(entity_type, entity_id)`.

## 15. Required unique constraints

Summary (full list in Section D): `organizations.gstin`, `organizations.pan`, `branches(organization_id, code)`, `departments(organization_id, name)`, `projects(branch_id, code)`, `users.email`, `users(organization_id, employee_id)`, `roles(organization_id, name)`, `permissions(module, action)`, `role_permissions(role_id, permission_id)`, `access_grants(user_id, scope_type, branch_id, project_id)`.

## 16. Required foreign keys

Summary (full list in Section D): `branches.organization_id → organizations.id`; `departments.organization_id → organizations.id`; `projects.branch_id → branches.id`; `users.organization_id → organizations.id`, `users.department_id → departments.id`, `users.role_id → roles.id`; `roles.organization_id → organizations.id`; `role_permissions.role_id → roles.id`, `role_permissions.permission_id → permissions.id`; `access_grants.user_id → users.id`, `access_grants.branch_id → branches.id` (nullable), `access_grants.project_id → projects.id` (nullable); `audit_logs.actor_user_id → users.id` (nullable, so system/bootstrap events don't require a user).

## 17. Soft-delete/active-state strategy

**[APPROVED]** Soft delete (`deleted_at`) throughout — records are archived, never hard-deleted (B.2). Account activation/deactivation is explicitly soft, not deletion (F.5). Branches support activation/deactivation (F.2).

**[DESIGN PROPOSAL]** Two distinct, coexisting concepts, since the context doc describes both a lifecycle toggle (active/inactive, reversible, expected to happen routinely — e.g. an employee's temporary leave) and true archival (deleted_at, meant for "this record shouldn't have existed / is retired"):
- `is_active` (boolean) — routine, reversible toggle. Applies to `branches`, `users`, `departments`, `roles`, `permissions`.
- `deleted_at` (nullable timestamp) — archival, per B.2's blanket rule, applied to every entity listed above plus `projects`, `access_grants`.

`audit_logs` is the one exception: append-only, no `deleted_at`, no `updated_at` — an audit record must never be edited or archived away.

**[REQUIRES DECISION]** Whether `deleted_at` and `is_active` should really both exist on every entity, or whether that's redundant for some of them (e.g., does `departments` need `is_active` at all, given F.3 never mentions department activation the way F.2 mentions it for branches)?

## 18. Created/updated timestamps

**[DESIGN PROPOSAL]** `created_at` / `updated_at` (timestamptz, default `now()`, `updated_at` auto-touched) on every entity except `audit_logs` (which is append-only and has only `created_at`). This isn't stated verbatim in the context doc but is a direct, uncontroversial consequence of B.2's soft-delete-and-history requirements — flagged as a proposal rather than an "approved" item purely because the doc never spells out the column names.

**[DESIGN PROPOSAL]** `created_by` / `updated_by` (nullable FK → `users.id`) on `branches`, `departments`, `projects`, `users`, `roles`, `access_grants` — needed to satisfy F.5's "attributable" requirement and Section A's audit expectations. Nullable because the bootstrap script creates the first Organization/Administrator with no acting user yet.

## 19. Data ownership and tenant isolation

**[APPROVED]** Every business record traces to an Organization, directly or transitively (B.3). No duplication of shared master entities across modules — every module references the existing master (`organization_id`, `branch_id`, `project_id`, `user_id`, …) rather than storing its own copy (B.2).

**[DESIGN PROPOSAL]** Tenant isolation is enforced at two layers, matching B.4's chain exactly:
1. **Application layer (primary):** every Prisma query the backend builds for a tenant-scoped table is required to include a `WHERE organization_id = :currentOrgId` (and, where relevant, branch/project scope) — this is not optional and not left to each route handler to remember; it's built into a shared query-scoping helper so it can't be silently skipped by a new module.
2. **PostgreSQL RLS (defense-in-depth):** see Section 20.

## 20. How the database supports the approved authorization chain

**[APPROVED]** The chain is fixed by B.4:

```
Request → Authentication → Application RBAC → Project/Branch Scope Validation → Prisma → PostgreSQL → RLS (defense-in-depth)
```

The backend must fully authorize (identity + permission + scope) *before* the Prisma query executes. RLS must not be relied on to catch what the application layer missed, and no rule should be implemented redundantly in complicated form in both layers (B.4).

**[DESIGN PROPOSAL]** How the schema makes each link real:

- **Authentication:** Supabase Auth issues a JWT; Express verifies it (signature/expiry) before anything else runs. No schema involvement beyond `users.id` matching the JWT `sub` claim.
- **Application RBAC:** on a verified request, the backend loads `users` → `roles` → `role_permissions` → `permissions` for that user and checks the specific `(module, action)` the route requires. This is a set of ordinary indexed lookups, not a database-level policy.
- **Scope Validation:** the backend loads that user's `access_grants` (short-circuiting entirely if `users.is_org_admin = true`), resolves branch-level grants to their current project set, and confirms the requested `branch_id`/`project_id` is in that resolved set — again, application code, before Prisma is asked to fetch business rows.
- **Prisma:** once authorized, Prisma queries always carry the resolved `organization_id`/`branch_id`/`project_id` filters as ordinary `WHERE` clauses — Prisma itself has no authorization awareness, it's just the mechanism the already-authorized scope gets applied through.
- **PostgreSQL:** stores the data; every tenant-scoped table has the FK columns needed for the layer above and below to do their job.
- **RLS (defense-in-depth):** `[REQUIRES DECISION]` — whether Module 1 turns RLS policies on now (e.g., `USING (organization_id = current_setting('app.current_org_id')::uuid)` on every tenant table, with the backend issuing `SET LOCAL app.current_org_id` per transaction) or whether RLS is explicitly deferred to a later hardening pass. The context doc approves RLS as a *principle* (B.4) but doesn't say it must ship with Module 1's first migration. I'd rather you decide this explicitly than have it silently slip to "later" and never happen, or silently ship without your sign-off on the session-variable mechanism.

---

## D. Entity Catalog

Notation: **PK** = primary key, all UUID (`gen_random_uuid()`) unless noted — **[DESIGN PROPOSAL]**: UUID is chosen for consistency with Supabase Auth's `auth.users.id`, which is UUID; nothing in the context doc mandates an ID strategy. All FKs `ON DELETE RESTRICT` unless noted (soft-delete convention means hard cascade deletes should essentially never fire — a `RESTRICT` that never trips in practice is safer than a `CASCADE` that silently does the wrong thing once).

### 1. `organizations` **[APPROVED entity, DESIGN PROPOSAL fields]**

| Field | Type | Req'd | Notes |
|---|---|---|---|
| id | uuid | Y | PK |
| legal_name | text | Y | |
| trade_name | text | N | |
| logo_url | text | N | Supabase Storage signed path |
| gstin | text | N | |
| pan | text | N | |
| address_line1 / line2 / city / state / pincode / country | text | Y/N | registered address |
| contact_email | text | N | |
| contact_phone | text | N | |
| financial_year_start_month | smallint | Y | 1–12 |
| settings | jsonb | N | extensible company-level settings |
| created_at / updated_at | timestamptz | Y | |
| deleted_at | timestamptz | N | archival only; realistically never set in V1 |

- **Unique:** `gstin` (partial, where not null), `pan` (partial, where not null)
- **FK:** none (root entity)
- **Indexes:** unique indexes above
- **Relationships:** 1—N `branches`, `departments`, `users`, `roles`, `projects` (denormalized), `audit_logs`, 1—1 `company_setup_progress`
- **Delete/update:** soft delete only; in practice never deleted in V1
- **Security:** GSTIN/PAN are sensitive; only `organization:configure` permission may edit

### 2. `branches` **[APPROVED]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| organization_id | uuid | Y (FK) |
| code | text | Y |
| name | text | Y |
| address_line1/line2/city/state/pincode | text | mixed |
| contact_phone / contact_email | text | N |
| branch_manager_user_id | uuid | N (FK → users, nullable) |
| is_active | boolean | Y, default true |
| created_by / updated_by | uuid | N (FK → users) |
| created_at / updated_at / deleted_at | timestamptz | see §17–18 |

- **Unique:** `(organization_id, code)`
- **FK:** `organization_id → organizations.id`; `branch_manager_user_id → users.id` (nullable, `ON DELETE SET NULL`)
- **Indexes:** `organization_id`, `is_active`, `branch_manager_user_id`
- **Relationships:** 1—N `projects`; targeted by `access_grants` via `branch_id`
- **Delete/update:** soft delete; **[REQUIRES DECISION]** whether deactivation is blocked while active projects/grants exist
- **Security:** branch-level data is the primary scope boundary for non-admin users — integrity of `is_active`/`deleted_at` here directly affects who can see what

### 3. `departments` **[APPROVED]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| organization_id | uuid | Y (FK) |
| name | text | Y |
| code | text | N |
| description | text | N |
| is_active | boolean | Y, default true — **[REQUIRES DECISION]**, see §17 |
| created_at / updated_at / deleted_at | timestamptz | |

- **Unique:** `(organization_id, name)`
- **FK:** `organization_id → organizations.id`
- **Indexes:** `organization_id`
- **Relationships:** 1—N `users` (`users.department_id`, nullable)
- **Delete/update:** soft delete; existing users keep their historical `department_id` reference even if the department is later archived
- **Security:** **structurally excluded from every access-control join** — no relationship to `access_grants`, `roles`, or `permissions`, by design (Section C)

### 4. `projects` **[APPROVED entity, minimal-for-Module-1 DESIGN PROPOSAL]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| branch_id | uuid | Y (FK) |
| organization_id | uuid | Y (FK, denormalized) — **[REQUIRES DECISION]** |
| code | text | Y |
| name | text | Y |
| is_active | boolean | Y, default true |
| created_by / updated_by | uuid | N (FK → users) |
| created_at / updated_at / deleted_at | timestamptz | |

- **Unique:** `(branch_id, code)`
- **FK:** `branch_id → branches.id`; `organization_id → organizations.id`
- **Indexes:** `branch_id`, `organization_id`, `is_active`
- **Relationships:** targeted by `access_grants` via `project_id`
- **Delete/update:** soft delete
- **Security:** the finest-grained access scope in Module 1; full attribute set deferred to the Project Management module (F.9)

### 5. `users` **[APPROVED]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) — **[REQUIRES DECISION]**: proposed = Supabase `auth.users.id` |
| organization_id | uuid | Y (FK) |
| employee_id | text | Y |
| full_name | text | Y |
| email | text | Y |
| phone | text | N |
| profile_photo_url | text | N |
| department_id | uuid | N (FK) |
| designation | text | N — **[REQUIRES DECISION]** free text vs. master table |
| role_id | uuid | Y (FK) |
| is_org_admin | boolean | Y, default false |
| status | text/enum | Y — `invited` \| `active` \| `deactivated` |
| joining_date | date | N |
| last_login_at | timestamptz | N |
| created_by / updated_by | uuid | N (FK → users, self-referential) |
| created_at / updated_at / deleted_at | timestamptz | |

- **Unique:** `email`; `(organization_id, employee_id)`
- **FK:** `organization_id → organizations.id`; `department_id → departments.id` (nullable); `role_id → roles.id`
- **Indexes:** `organization_id`, `role_id`, `department_id`, `status`, `email`
- **Relationships:** 1—N `access_grants`, `audit_logs` (as actor); self-referential `created_by`/`updated_by`/`branch_manager_user_id`
- **Delete/update:** never hard-deleted; `status = deactivated` is the routine path, `deleted_at` reserved for true erroneous-record archival
- **Security:** **no password/credential material stored here** — that lives entirely in Supabase Auth; `is_org_admin` is the single highest-privilege flag in the schema and every write to it must itself be an `audit_logs` entry

### 6. `roles` **[APPROVED]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| organization_id | uuid | Y (FK) — **[DESIGN PROPOSAL]** |
| name | text | Y |
| description | text | N |
| is_system_role | boolean | Y, default false |
| is_active | boolean | Y, default true |
| created_by / updated_by | uuid | N |
| created_at / updated_at / deleted_at | timestamptz | |

- **Unique:** `(organization_id, name)`
- **FK:** `organization_id → organizations.id`
- **Indexes:** `organization_id`, `is_active`
- **Relationships:** 1—N `users`; M—N `permissions` via `role_permissions`
- **Delete/update:** soft delete; **[REQUIRES DECISION]** business rule when users are still assigned

### 7. `permissions` **[REQUIRES DECISION on resource dimension — see §7 above]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| module | text | Y — e.g. `branch`, `user`, `role` (Module 1 catalog only) |
| action | text | Y — one of the 10 approved actions |
| code | text | Y — e.g. `branch:create` |
| description | text | N |
| is_active | boolean | Y, default true |
| created_at / updated_at | timestamptz | Y |

- **Unique:** `code`; `(module, action)`
- **FK:** none
- **Indexes:** `module`, `action`
- **Relationships:** M—N `roles` via `role_permissions`
- **Delete/update:** seeded/code-defined only in Module 1 — no soft delete needed in practice, `is_active` exists only to retire a permission without breaking `role_permissions` history
- **Security:** not administrator-editable in Module 1 (proposal); only role↔permission *assignment* is dynamic

### 8. `role_permissions` **[APPROVED relationship]**

| Field | Type | Req'd |
|---|---|---|
| role_id | uuid | Y (FK, PK part) |
| permission_id | uuid | Y (FK, PK part) |
| granted_at | timestamptz | Y |
| granted_by | uuid | N (FK → users) |

- **PK:** composite `(role_id, permission_id)`
- **FK:** `role_id → roles.id`; `permission_id → permissions.id`; `granted_by → users.id`
- **Indexes:** `role_id`, `permission_id`
- **Delete/update:** hard delete on revoke (represents current-state grant, not history); the revoke event itself is recorded in `audit_logs`

### 9. `access_grants` **[APPROVED, with one flagged deviation — see §9 above]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| user_id | uuid | Y (FK) |
| scope_type | text | Y — `branch` \| `project` |
| branch_id | uuid | N (FK) — proposed real-FK alternative to bare `scope_id` |
| project_id | uuid | N (FK) — proposed real-FK alternative to bare `scope_id` |
| granted_at | timestamptz | Y |
| granted_by | uuid | N (FK → users) |
| revoked_at | timestamptz | N |

- **Unique:** `(user_id, scope_type, branch_id, project_id)`
- **FK:** `user_id → users.id`; `branch_id → branches.id` (nullable); `project_id → projects.id` (nullable)
- **CHECK:** exactly one of `branch_id`/`project_id` is non-null, matching `scope_type`
- **Indexes:** `user_id`, `(scope_type, branch_id)`, `(scope_type, project_id)`
- **Relationships:** N—1 `users`; N—1 `branches` or `projects`
- **Delete/update:** **[REQUIRES DECISION]** hard delete vs. `revoked_at` soft-revoke, see §9
- **Security:** this table *is* the scope-validation data source for the authorization chain (§20) — its integrity is as security-critical as the permission system itself

### 10. `user_invitations` **[REQUIRES DECISION — may not be needed at all, see §5/§11]**

Proposed only if Supabase Auth's native invite mechanism is judged insufficient. If adopted:

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| email | text | Y |
| organization_id | uuid | Y (FK) |
| invited_role_id | uuid | Y (FK → roles) |
| invited_department_id | uuid | N (FK → departments) |
| token_hash | text | Y |
| status | text | Y — `pending` \| `accepted` \| `expired` \| `revoked` |
| invited_by | uuid | Y (FK → users) |
| expires_at | timestamptz | Y |
| accepted_at | timestamptz | N |
| created_at / updated_at | timestamptz | Y |

- **Unique:** `token_hash`; partial unique `(email)` where `status = 'pending'`
- **Security:** token stored only as a hash, single-use, expiring

### 11. `company_setup_progress` **[APPROVED need, DESIGN PROPOSAL shape — step list unresolved, see §12]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| organization_id | uuid | Y (FK, unique — one row per org) |
| setup_completed | boolean | Y, default false |
| setup_percentage | int | Y, default 0 |
| completed_at | timestamptz | N |
| completed_by | uuid | N (FK → users) |
| created_at / updated_at | timestamptz | Y |

Plus child table `company_setup_steps` (`organization_id`, `step_key`, `completed_at`, `completed_by`) — proposed instead of a `completed_steps`/`remaining_steps` JSON pair, so remaining steps is *derived* (full step enum minus completed rows) rather than stored redundantly and risking drift. **[REQUIRES DECISION]** — the context doc names `completed_steps`/`remaining_steps` as if they're literal stored fields; this normalized alternative is a proposal, not a confirmed match.

### 12. `audit_logs` **[APPROVED need (Section A, G), DESIGN PROPOSAL shape]**

| Field | Type | Req'd |
|---|---|---|
| id | uuid | Y (PK) |
| organization_id | uuid | Y (FK) |
| actor_user_id | uuid | N (FK → users) — null for system/bootstrap events |
| action | text | Y — e.g. `user.created`, `login.failed`, `access_grant.revoked` |
| entity_type | text | Y |
| entity_id | uuid | N |
| before_state | jsonb | N |
| after_state | jsonb | N |
| ip_address | text | N |
| user_agent | text | N |
| created_at | timestamptz | Y |

- **Indexes:** `(organization_id, created_at)`, `(entity_type, entity_id)`, `actor_user_id`
- **Delete/update:** none — append-only; no `updated_at`, no `deleted_at`
- **Security:** read access requires a dedicated `audit:view` permission (proposed under the Module 1 permission catalog); never exposed to non-privileged roles; **[REQUIRES DECISION]** retention policy

---

## A. Entity Relationship Overview

```
organizations (1)
  ├── (N) branches ──────────────┐
  │        └── (N) projects ─────┤
  ├── (N) departments             │
  ├── (N) roles ── (N:N via role_permissions) ── permissions (global catalog)
  ├── (N) users                   │
  │        ├── department_id ──> departments
  │        ├── role_id ────────> roles
  │        └── (N) access_grants ─┴──> branch_id | project_id  (exactly one)
  ├── (1) company_setup_progress ── (N) company_setup_steps
  └── (N) audit_logs (actor_user_id ──> users, nullable)
```

## B. Proposed Database Table List

`organizations`, `branches`, `departments`, `projects`, `users`, `roles`, `permissions`, `role_permissions`, `access_grants`, `company_setup_progress`, `company_setup_steps`, `audit_logs`, and conditionally `user_invitations` (pending the Supabase-native-invite decision).

## C. Authorization Data Flow

```
JWT verified (Supabase Auth)
  → load users row by id (must be status='active', deleted_at is null)
  → load roles + role_permissions + permissions for users.role_id
      → is the required (module, action) present?  If is_org_admin, skip scope check entirely.
  → load access_grants for user_id; resolve branch-level grants to their current project set
      → is the requested branch_id/project_id within the resolved set?
  → only now: Prisma query, scoped by organization_id (+branch/project where relevant)
  → PostgreSQL executes
  → RLS policy re-checks organization_id (and branch/project scope where configured) as a backstop
```

## D. Setup Wizard Data Flow

```
Bootstrap script → organizations row created → bootstrap users row (is_org_admin=true) created
  → company_setup_progress row created (setup_completed=false)
  → Administrator logs in → wizard shown (banner, dismissible)
  → each step completion writes a company_setup_steps row + recalculates setup_percentage
  → setup_completed flips true only once every required step (list pending §12) is recorded
  → wizard never auto-shows again; reachable via Administration → Company Setup
```

## E. Open Decisions Requiring Your Approval

1. **Permission resource/module list** (§7) — is the proposed Module 1 catalog (`organization`, `branch`, `department`, `project`, `user`, `role`, `permission`, `access_grant`, `company_setup`) correct/complete?
2. **Is the permission catalog fixed/seeded, or admin-extensible at runtime?** (§7)
3. **Supabase Auth ↔ `users` table integration shape** — shared UUID + no local password storage, as proposed? (§5, §11)
4. **`access_grants.scope_id` (polymorphic, literal B.3 shape) vs. `branch_id`/`project_id` (two real FKs, my proposal)** — this is the one place I'm proposing something that visibly differs from the literal approved column names in B.3. (§9)
5. **`access_grants` revocation: hard delete vs. `revoked_at` soft-revoke?** (§9)
6. **Invitation mechanism: rely on Supabase Auth's native invite, or build a custom `user_invitations` table?** (§11)
7. **Setup Wizard step count contradiction: 8 named steps vs. banner text says "7 steps remaining."** Must be resolved before the step enum is written. (§12)
8. **Setup Wizard steps "Approval Configuration" and "Document Templates" reference future-module systems** — what does Module 1 actually persist for these two steps? (§12)
9. **Session revocation** — does deactivating a user need immediate force-logout (a local session table), or is JWT-expiry-bound deactivation acceptable? (§11)
10. **Does `access_grants` need a session-context mechanism spec'd now for RLS** (`SET LOCAL app.current_org_id` per transaction), or is RLS explicitly deferred past Module 1's first migration? (§20)
11. **Branch deactivation business rule** while active projects/grants exist — block, warn, or allow? (§2)
12. **Role deactivation/deletion business rule** while users are still assigned that role — block, reassign, or allow? (§6)
13. **`is_active` vs `deleted_at` on every entity** — confirm this dual model is wanted everywhere proposed, or trim it per-entity. (§17)
14. **Denormalized `organization_id` on `projects`** — keep for query/RLS convenience, or always join through `branches`? (§4)
15. **Designation as free text vs. its own master table** (like Department). (§5)
16. **Audit log retention policy** — not specified anywhere yet. (§13)

---

Nothing beyond this document has been created. No `schema.prisma`, no migration, no database connection. Awaiting your decisions on Section E (or approval to proceed with the proposals as written) before schema design begins.
