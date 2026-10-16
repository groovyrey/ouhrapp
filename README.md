# ouhrapp

An HR management prototype covering the full employee lifecycle: workforce planning, recruitment, onboarding, employee records, a manager decision-support assistant, leave, time and attendance, payroll, performance, compensation, employee relations, reporting, and administration.

This doc covers the current prototype, how it is built as a single-page app, and where it is headed. The full production stack and per-module requirements live in `requirements.txt`.

## Status

Prototype. Static HTML, CSS, and JavaScript. No framework, no build step, no dependencies. Runs from `file://` or any static host.

All data is mock data held in the browser. Mutations persist to `localStorage`. Nothing is sent to a server except the optional assistant call described below.

## Quick start

Open `index.html` directly in a browser, or serve the folder:

```
npx serve .
```

Sign in with username `admin` and password `admin123`.

## Authentication

Prototype auth gate only, not real security. Credentials and the session live client side.

- `js/auth/session.js` holds a single account (`admin` / `admin123`, role Administrator) and reads and writes the session in `localStorage` under `ouhrapp:session:v1`.
- `js/views/login.js` renders the sign-in form, validates on submit, and shows an error on bad credentials.
- `js/main.js` decides on boot: an existing session mounts the shell and router, otherwise it renders the login form and hides the sidebar, topbar brand, and user pill via the `auth-screen` body class. Sign out clears the session and reloads.

Because the check runs in the browser, this only gates the demo UI. The real app should authenticate server side and enforce roles there.

## Modules

Each sidebar entry maps to one view in `js/views/`:

- Dashboard: headcount snapshot and per-department counts.
- Assistant: a manager-facing chat that answers questions across every module using non-private data (see below).
- Workforce planning: planned vs actual headcount per department, with an editable plan target and gap.
- Recruitment: kanban pipeline (Applied, Screening, Interview, Offer, Hired) with add and move.
- Onboarding: template task checklists per new hire with a progress bar.
- Employees: directory table with create, edit, delete, and search.
- Leave: request intake and manager approval.
- Time and attendance: clock in and out, manual time entry, running total.
- Payroll: monthly run drafts computed from active salaries.
- Performance: review cycles with editable ratings.
- Compensation: salary bands and current salaries.
- Relations and compliance: case log with status, and policy acknowledgment tracking.
- Reports: headcount bars by department and status, average salary table.
- Administration: user list with role assignment, plus reset demo data.

## SPA strategy

The app is a hand-rolled single-page app built on native ES modules. There is no router library, no state library, and no compilation step.

### 1. Static shell, swapped outlet

`index.html` holds the persistent chrome: the topbar, the sidebar, the mobile menu button, and an empty `<main id="main">`. Only `#main` changes between views, so navigation never reflows the shell.

### 2. Hash routing

`js/router.js` owns navigation.

- Routes are a plain map from a key to `{ title, view }`.
- The active key is read from `location.hash` (for example `#/employees`), with `dashboard` as the default and fallback for unknown keys.
- On every `hashchange` the router clears `#main`, calls the matched view function with the outlet, scrolls to top, sets `document.title`, and dispatches a `route:change` custom event.

Using the hash means no server rewrite rules are needed, so the same files work from `file://`, GitHub Pages, or any static host.

### 3. Views as plain functions

Every view is a function `xView(root)` that:

- sets `root.innerHTML` to its markup (template strings),
- queries the nodes it needs,
- attaches its own event listeners, and
- defines a local `paint()` for partial re-renders of just the dynamic region.

Views do not import each other. `js/views/index.js` collects them into a single `views` object that the router consumes, so the router never needs to know file paths.

### 4. Central store with persistence

`js/store.js` is the only module that touches data.

- A single module-level `state` object is loaded once at import time.
- `load()` starts from `seed` and merges any saved JSON on top, so new seed fields appear for existing users.
- `persist()` writes the whole state to `localStorage` under `ouhrapp:data:v1` after every mutation.
- Reads are plain getters. Writes are small named functions (`addEmployee`, `moveCandidate`, `runPayroll`, and so on). `resetData()` restores the seed.

Views import store functions only. They never read or write `localStorage` themselves.

### 5. Layering and file structure

The code follows a strict separation of concerns, with a barrel `index.js` per folder so imports stay clean:

```
index.html              app shell: topbar, sidebar, icon sprite, outlet
css/style.css           design tokens, base, typography
css/app-shell.css       topbar, sidebar, mobile drawer
css/views.css           tables, forms, cards, buttons, bars
js/main.js              entry: boots nav then router
js/index.js             barrel
js/router.js            hash router and route table
js/nav.js               mobile drawer, focus trap, active-link highlight
js/store.js             state and localStorage persistence
js/seed.js              mock seed data and shared constants
js/auth/                session state and the credential gate
js/views/               one file per module
js/components/          shared renderers: table, bars, form, card
js/services/            assistant context builder and chat client
js/utils/               escapeHtml, formatDate, formatMoney, diffDays
assets/                 images and static files
documents/              ARCH, DFD, ERD, USE-CASE, MIGRATION
```

Rules the codebase follows: no API or fetch calls inside a view (they live in `services/`), no hardcoded data in views (it comes from `store`/`seed`), user text is passed through `escapeHtml`, and files stay small and single-purpose.

### 6. Rendering approach and tradeoffs

Views build HTML strings and assign them via `innerHTML`. Interactive tables use event delegation on the view root (listen on the container, match `data-*` attributes on the target). This keeps the code small and dependency-free.

Tradeoffs, by design for a prototype:

- Full region re-render on change rather than a virtual DOM diff.
- Local, single-user state, so there is no sync or conflict handling.
- The assistant depends on an external endpoint, streams its reply as it generates, and degrades to a local snapshot when it is unavailable.

Tables collapse into stacked rows on narrow screens, and the assistant repaints as tokens stream in, both driven by the same local `paint()` pattern.

### 7. Styling and design language

Three stylesheets, layered: tokens and base, then shell, then view primitives. Theme values are CSS custom properties in `css/style.css`, so retheming is a token change.

- Light theme only. Warm paper background with black ink and a red accent.
- Type: Geist for UI, JetBrains Mono for numerals and micro labels, Instrument Serif available via the `.serif` utility.
- Icons: an inline SVG sprite of Lucide symbols in `index.html`. Icons use `stroke="currentColor"`, so they inherit color and size from context.
- Shell: the sidebar collapses into a drawer behind a borderless hamburger button on narrow screens, the active nav item carries a chevron, and the user pill stays visible on mobile.

## Manager assistant

This is the one module with logic beyond CRUD. It is a manager-facing chat that helps with decisions across people, hiring, onboarding, leave, attendance, payroll, performance, compensation, compliance, and reports. It is not leave-specific.

### Context builder (`js/services/assistantContext.js`)

`buildContext()` reads the store and returns a snapshot of everything that is not private and that helps a manager decide:

- People: name, department, title, status, start date.
- Headcount totals and per-department active counts, plus planned vs actual gaps.
- Recruitment by stage, onboarding progress and remaining tasks.
- Attendance hours and overtime counts per employee.
- Payroll run periods, headcount, and status (aggregates only, no per-person pay).
- Performance ratings and average, and compensation bands (structure, not personal pay).
- Relations counts by type and status, and compliance acknowledgment counts.
- Leave types, blackout dates, pending requests, and balances.

Private data is deliberately excluded: individual salaries, contact details, government ids, and confidential case narratives.

### Chat client (`js/services/assistant.js`)

The snapshot, the system prompt, and the recent conversation go to a Gemini endpoint on a Cloudflare Worker, which streams the answer back as plain text:

```
POST https://worker8651.reymartcenteno03.workers.dev/api/groovyrey/gemini
body: { prompt, system, temperature: 0.2, json: false, maxTokens: 2048 }
response: text/plain stream, with an X-Model header naming the model
```

The worker hardcodes the model (`gemma-4-26b-a4b-it`) and calls it with the official `@google/generative-ai` SDK using `generateContentStream`, so the browser receives tokens as they are produced rather than one final block.

The client reads the response body with a stream reader and renders tokens as they arrive, so the answer types out progressively while the rest is still generating. The request is abandoned after 90 seconds.

The system prompt tells the model to advise with a clear recommendation and reason, to use only the snapshot, to never invent data, and to refuse private data while offering a non-private angle. History is kept in `localStorage` under `ouhrapp:assistant:v1` and capped at 60 messages.

If the endpoint is unreachable, times out, or returns an empty reply, it falls back to a deterministic local summary of the snapshot marked `source: "fallback"`.

For local development the endpoint allows only the `groovyrey.github.io` and `localhost` origins. The assistant advises; the manager decides.

## Documents

Longer design docs live in `documents/`:

- `ARCH.md`: architecture diagrams for the prototype and the production target (Mermaid).
- `DFD.md`: data flow diagrams.
- `ERD.md`: entity relationship diagram.
- `USE-CASE.md`: use cases per actor.
- `MIGRATION.md`: prototype-to-production migration plan.

## Leave

`js/views/leave.js` files a request (employee, type, dates, reason) with status `Needs review`, and the manager approves or rejects it. Approval commits the days against the employee's balance. Leave types still encode policy (notice days, document rules, concurrency limits) and are surfaced to the assistant as context, but the app no longer auto-decides.

## Data model

`js/seed.js` defines the whole dataset and two shared constants (`DEPARTMENTS`, `STAGES`). Top-level collections: `employees`, `plans`, `candidates`, `onboardings`, `timeEntries`, `payrollRuns`, `reviews`, `salaryBands`, `cases`, `policies`, `users`, `leaveTypes`, `leaveBalances`, `leaveRequests`, and `blackoutDates`.

Leave types encode policy: Vacation (paid, 5 day notice, max 2 concurrent), Sick (paid, document over 2 days, max 4), Personal (unpaid, 2 day notice, max 3), Bereavement (paid, max 3).

## Development notes

```
npx serve .          # or any static server, for example:
servelive 3000 .     # no cache plus live reload
```

Because the app uses native ES modules, it must be served over `http://` for module loading in some browsers. Opening `index.html` directly works in modern browsers but a local server is the safe default.

## Production direction

The prototype maps one to one onto the planned production build, which is a Next.js App Router app with a real database and multi-tenant isolation. Highlights from `requirements.txt`:

- Frontend: Next.js, React, TypeScript, Tailwind, TanStack Table, Recharts, React Hook Form with Zod, dnd-kit.
- Backend: Next.js route handlers and server actions, Zod validation, Drizzle ORM, background jobs, scheduled tasks.
- Data: PostgreSQL with row-level security, materialized views for reporting, audit log on every mutation.
- Auth: Auth.js with SSO, role-based access (admin, HR, manager, employee, payroll officer), server-side permission checks, 2FA.
- Integrations: a payroll provider API for tax, deductions, payslips, and disbursement (no hand-rolled tax logic), plus accounting exports.
- Security and ops: WAF and bot protection on Cloudflare, encrypted PII, Sentry, structured logs, Vitest and Playwright, Vercel plus Cloudflare for storage, queues, and cron.

Each prototype module lists its production requirements in that file and can be ported independently, since the store, services, and view layers are already separated.
