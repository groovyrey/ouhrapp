# Migration plan: prototype to production

This document turns the `ouhrapp` prototype into a production, multi-tenant HRMS. It states what carries over, what gets replaced, the recommended stack, the target data model, a phased delivery plan, and per-module porting notes.

The prototype is intentionally shaped so each concern maps to a production concern one to one. `requirements.txt` holds the authoritative product spec. This file is the execution plan.

## Guiding principles

- Port the domain, do not port the plumbing. Leave policy fields, field names, the assistant's privacy rules, and the design language carry over. `innerHTML` rendering, `localStorage`, and hash routing do not.
- One module at a time. The store, services, and view layering in the prototype becomes API, service, and UI layering, so modules can ship independently behind a feature flag.
- Tenant isolation and auditing are foundational, not a later hardening step. Add them before the first write endpoint.
- No hand-rolled payroll tax, banking, or e-signature logic. Use providers.
- Every write is validated (Zod) and audited, and every read is permission-checked server side.

## Recommended stack

| Layer | Recommended | Notes and alternatives |
| --- | --- | --- |
| App framework | Next.js (App Router) with React and TypeScript | Server components for reads, route handlers and server actions for writes. |
| Styling | Tailwind CSS with the prototype tokens as the theme | Port CSS custom properties from `css/style.css` into the Tailwind theme. Keep Geist, JetBrains Mono, Instrument Serif. |
| Data grids | TanStack Table | Replaces `js/components/table.js`. |
| Charts | Recharts | Replaces `js/components/bars.js`. |
| Forms and validation | React Hook Form plus Zod | Share Zod schemas between client and server. Replaces `js/components/form.js` field builder. |
| Drag and drop | dnd-kit | For the recruitment kanban and a future org chart. |
| ORM | Drizzle ORM | Prisma is the alternative. Typed schema that mirrors the target tables. |
| Database | PostgreSQL, Neon or Supabase | Row-level security for tenant isolation. Materialized views for reporting. |
| Auth and access | Auth.js (NextAuth) with credentials plus Google and Microsoft SSO | Roles: admin, HR, manager, employee, payroll officer. 2FA and session rotation. SCIM later. |
| Object storage | Cloudflare R2 (Supabase Storage as alternative) | Resumes, contracts, documents. Signed URLs and virus scanning on upload. |
| Email and notifications | Resend or Cloudflare Email | Invites, approvals, alerts. In-app notifications via table plus SSE or WebSocket. |
| Background jobs | Inngest or pg-boss | Reminders, scheduled exports, retention timers. Cloudflare Cron for schedules. |
| Cache and rate limiting | Upstash Redis or Cloudflare KV | Rate limit the AI endpoint and expensive reads. |
| Observability | Sentry plus structured logs and uptime checks | Trace the AI call and every write. |
| Testing | Vitest for units, Playwright for end to end | Port the assistant context redaction tests first. |
| Hosting | Vercel for the app, Cloudflare for storage, queues, cron, DNS, WAF | Separate dev, staging, and production databases. |
| CI/CD | GitHub Actions | Type check, lint, unit, and end to end gates. Preview deploys per pull request. |
| Mobile | Responsive PWA first, React Native later if needed | The prototype is already responsive. |

## What carries over

- Design tokens and visual language from `css/style.css`, `css/app-shell.css`, and `css/views.css`. They become the Tailwind theme and shared UI primitives.
- The icon sprite approach (Lucide) and the light theme with the black and red accent.
- Domain constants: `DEPARTMENTS`, `STAGES`, leave types with their policy fields (`paid`, `noticeDays`, `requiresDoc`, `maxConcurrent`).
- The assistant's context builder in `js/services/assistantContext.js`, especially the exclusion list: no individual salaries, contact details, government IDs, or case narratives.
- The assistant's prompt and fallback contract in `js/services/assistant.js`: system prompt, recent turns, 20 second timeout, and a deterministic local snapshot answer marked `source: fallback`.
- The seed dataset in `js/seed.js`, reused as test fixtures and demo tenants.

## What gets replaced

| Prototype | Production |
| --- | --- |
| `js/router.js` hash router | App Router file system routes plus server components. |
| `js/store.js` module state | Drizzle queries against PostgreSQL, scoped by tenant. |
| `localStorage` persistence | Database with migrations and an audit log. |
| `xView(root)` innerHTML render | React components and server-rendered pages. |
| `js/nav.js` hand-rolled drawer | A shared layout component with an accessible nav. |
| Client fetch to the Gemini worker | Server-side call with a server-held key, rate limiting, and caching. |
| `escapeHtml` in `js/utils/format.js` | React escaping plus Zod validation at the boundary. |
| Manual `route:change` event | Framework data fetching and revalidation. |

## Target data model

Every table carries `id` (uuid), `tenant_id`, `created_at`, `updated_at`, and `created_by` unless noted. Prototype collections map as follows.

| Prototype collection | Target table | Key notes |
| --- | --- | --- |
| `employees` | `employees` | Add `tenant_id`, manager reference, employment type, government IDs (field-level encryption). |
| `plans` | `headcount_plans` | Unique on (tenant, department, period). |
| `candidates` | `candidates` and `candidate_stage_events` | Store stage transitions as an event log for funnel metrics. |
| `onboardings` and tasks | `onboarding_flows` and `onboarding_tasks` | Templates in `onboarding_templates`. |
| `timeEntries` | `time_entries` | Add source (manual or clock), shift reference, approval state. |
| `payrollRuns` | `payroll_runs` and `payslips` | Provider-backed, with approval workflow and stored documents. |
| `reviews` | `review_cycles` and `reviews` | Add goals and 360 feedback tables. |
| `salaryBands` | `salary_bands` | Per tenant and level. |
| `cases` | `employee_relations_cases` | Add case events and retention timers. |
| `policies` | `policies` and `policy_acknowledgments` | Acknowledgment becomes per employee, not a counter. |
| `users` | `users`, `roles`, `memberships` | Auth.js tables plus tenant membership and role. |
| `leaveTypes` | `leave_types` | Policy fields preserved exactly. |
| `leaveBalances` | `leave_balances` | Unique on (tenant, employee, type, period). |
| `leaveRequests` | `leave_requests` and `leave_decisions` | Final status and deciding actor stored as an immutable record. |
| `blackoutDates` | `blackout_dates` | Per tenant, per department optional. |
| `ouhrapp:assistant:v1` | `assistant_conversations` and `assistant_messages` | Chat history only; the context is derived, never stored. |

Additional tables required in production that the prototype lacks: `audit_log`, `notifications`, `attachments`, `sessions`, `invitations`, `feature_flags`, `assistant_conversations`, and `assistant_messages`.

## Leave: how it moves

The prototype decides nothing, so this is now a plain workflow module.

1. Keep the leave policy fields as data (`noticeDays`, `requiresDoc`, `maxConcurrent`) and surface them to the manager and the assistant. Do not port a rule engine.
2. File a request with status `Needs review` and no decision.
3. Replace the in-view Approve and Reject with permission-checked endpoints that append the deciding actor, debit the balance on approval, and write an audit entry.
4. Add a background job for notifications (submitted, decided) and a scheduled job to expire stale pending reviews.

## Manager assistant: how it moves

This is the one module with an external call, so it has its own porting notes.

1. Port `js/services/assistantContext.js` to a server-side context builder that reads the tenant's tables and returns the same redacted snapshot. Keep the exclusion list: no individual salaries, contact details, government IDs, or case narratives.
2. Keep the prompt contract from `js/services/assistant.js`: system prompt, the snapshot, and the recent turns. Move the call into a route handler so the key never ships to the client. Add per-tenant rate limiting and a short cache.
3. Keep the fallback: on timeout, error, or an empty reply, answer with the deterministic local snapshot summary marked `source: fallback`.
4. Store turns in `assistant_conversations` and `assistant_messages`, scoped by tenant and user, keeping the 60 message history cap.
5. Enforce the advice-only boundary. The assistant never writes business data, so every decision endpoint stays permission-checked.

Unit test the context builder's redaction against the seed fixtures before wiring the UI.

## Per-module porting order

Ordered so foundational pieces land first and each later module reuses them.

1. Employees and Administration. These establish auth, roles, tenancy, and the audit pattern that everything else depends on.
2. Onboarding and Workforce planning. Simple, template and table driven, good first workflow surfaces.
3. Recruitment. Introduces kanban, drag and drop, and file upload for resumes.
4. Leave. Introduces manager decisions and background notifications.
5. Time and attendance. Introduces clock events and approval states.
6. Payroll. Introduces the provider integration, approval workflow, and document storage.
7. Performance and Compensation. Introduce cycles, goals, and salary history.
8. Relations and Compliance. Introduces retention timers and per-employee acknowledgments.
9. Reports and analytics. Introduces materialized views and scheduled exports once the data is real.
10. Manager assistant. Last on purpose, since its context reads every other module. Introduces the AI service pattern.

## Phased plan

### Phase 0: Foundations

- Create the Next.js TypeScript repo, Tailwind with the ported tokens, ESLint, Prettier, and Vitest.
- Add GitHub Actions: type check, lint, unit tests. Wire Vercel preview deploys per pull request.
- Provision dev, staging, and production databases and set up migrations with Drizzle.
- Define the shared UI primitives (button, input, table, card, bars) from the prototype CSS.

Exit criteria: an empty app deploys to staging, CI is green, migrations run.

### Phase 1: Tenancy and access

- Add Auth.js with credentials first, then Google and Microsoft SSO.
- Add `tenants`, `users`, `memberships`, and `roles`. Enforce row-level security by `tenant_id`.
- Add the server-side permission check helper and apply it to every read and write.
- Add the `audit_log` table and a write helper.

Exit criteria: two tenants cannot see each other's data at the database level. A test proves it.

### Phase 2: Core records (Employees, Administration)

- Build the employees schema, directory, profile, and change history.
- Build user and role administration with audit review.
- Add Zod schemas shared between client and server.

Exit criteria: full employee CRUD, role management, and an audit trail, all tenant scoped.

### Phase 3: Workflow modules

- Onboarding, workforce planning, recruitment, leave, attendance.
- Port the leave filing and manager decision endpoints as described above.
- Add the notification system and background jobs.

Exit criteria: leave requests are decided server side by a manager with an auditable decision and notifications.

### Phase 4: Money and people development

- Payroll with the provider integration, approval workflow, payslip storage, and delivery.
- Performance cycles, goals, and feedback.
- Compensation bands, adjustments, and history.

Exit criteria: a payroll run can be drafted, approved, and delivered through the provider without client-side tax logic.

### Phase 5: Compliance, reporting, hardening

- Relations cases with retention timers, per-employee policy acknowledgments.
- Manager assistant, last since its context reads every module: redacted server-side snapshot, the AI call with rate limiting, and the local fallback.
- Reporting on materialized views, scheduled CSV and PDF export jobs.
- Field-level encryption for salary and government IDs. Data retention rules.
- Rate limiting, WAF and bot protection, Sentry, structured logs, uptime checks.
- Load and accessibility passes. Playwright end to end suite.

Exit criteria: security review passes, reports load within budget, the assistant answers from redacted tenant data with a working fallback, end to end suite is green.

### Phase 6: Cutover

- Seed the production tenant from real HR data via an import job. The demo `localStorage` data is throwaway and is not migrated.
- Run staging with representative data and a pilot team.
- Enable modules for the pilot tenant behind feature flags, then widen.

Exit criteria: pilot team uses the system for one full leave and payroll cycle with no critical defects.

## Cross-cutting requirements

- Validation: Zod at every boundary. Never trust the client.
- Auditing: one audit row per mutation with actor, before, and after.
- Errors: consistent API shape, Sentry capture, no stack traces to clients.
- Encryption: TLS in transit, encryption at rest, field-level encryption for PII such as salary and government IDs.
- Retention: configurable per tenant, aligned to GDPR and SOC2.
- Feature flags: gate each module so it can ship and roll back independently.
- Accessibility: keyboard and screen reader support, matching the focus handling already in `js/nav.js`.

## Risks and mitigations

- Scope creep across fourteen modules. Mitigation: the phased order above, one module at a time behind flags.
- Payroll correctness. Mitigation: provider owns tax and disbursement, we own workflow and records.
- AI reliability and cost. Mitigation: server-side call, redacted context, fallback to a local snapshot answer, rate limits, and caching. The assistant only advises; every decision still goes through a permission-checked endpoint.
- Tenant leakage. Mitigation: row-level security enforced in the database, not only in application code, plus a leak test in CI.
- Data quality on cutover. Mitigation: a staging import with validation before pilot.

## Rollback

Each module ships behind a flag and each phase ends at a tagged release. Rolling back a module disables its flag and its routes server side, leaving the rest of the system and all data intact. Database migrations are additive within a phase, and destructive changes are deferred to a follow-up release after the new path is proven.
