# ouhrapp

An HR management prototype covering the full employee lifecycle: workforce planning, recruitment, onboarding, employee records, leave automation, time and attendance, payroll, performance, compensation, employee relations, reporting, and administration.

This doc covers the current prototype, how it is built as a single-page app, and where it is headed. The full production stack and per-module requirements live in `requirements.txt`.

## Status

Prototype. Static HTML, CSS, and JavaScript. No framework, no build step, no dependencies. Runs from `file://` or any static host.

All data is mock data held in the browser. Mutations persist to `localStorage`. Nothing is sent to a server except the optional leave-evaluation call described below.

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
- Workforce planning: planned vs actual headcount per department, with an editable plan target and gap.
- Recruitment: kanban pipeline (Applied, Screening, Interview, Offer, Hired) with add and move.
- Onboarding: template task checklists per new hire with a progress bar.
- Employees: directory table with create, edit, delete, and search.
- Leave automation: request intake plus the two-stage rules and AI evaluation (see below).
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
js/views/               one file per module
js/components/          shared renderers: table, bars, form
js/services/            leave rules, leave AI, leave decision
js/utils/               escapeHtml, formatDate, formatMoney
assets/                 images and static files
```

Rules the codebase follows: no API or fetch calls inside a view (they live in `services/`), no hardcoded data in views (it comes from `store`/`seed`), user text is passed through `escapeHtml`, and files stay small and single-purpose.

### 6. Rendering approach and tradeoffs

Views build HTML strings and assign them via `innerHTML`. Interactive tables use event delegation on the view root (listen on the container, match `data-*` attributes on the target). This keeps the code small and dependency-free.

Tradeoffs, by design for a prototype:

- Full region re-render on change rather than a virtual DOM diff.
- Local, single-user state, so there is no sync or conflict handling.
- The AI evaluation depends on an external endpoint and degrades to rules-only when it is unavailable.

### 7. Styling and design language

Three stylesheets, layered: tokens and base, then shell, then view primitives. Theme values are CSS custom properties in `css/style.css`, so retheming is a token change.

- Light theme only. Warm paper background with black ink and a red accent.
- Type: Geist for UI, JetBrains Mono for numerals and micro labels, Instrument Serif available via the `.serif` utility.
- Icons: an inline SVG sprite of Lucide symbols in `index.html`. Icons use `stroke="currentColor"`, so they inherit color and size from context.

## Leave automation

This is the one module with real logic beyond CRUD. A request is evaluated in two stages, then routed.

### Stage 1: deterministic rules (`js/services/leaveRules.js`)

`evaluateRules` checks:

- Balance: remaining vs requested days.
- Notice period: days of notice given vs the leave type's `noticeDays`.
- Supporting document: required for absences over two days when the type sets `requiresDoc`.
- Blackout windows: overlap with configured company blackout dates.
- Team coverage: same-department peers already off for overlapping dates vs the type's `maxConcurrent`.

Each check returns `pass`, `flag`, or `fail`. Any `fail` is a hard fail. `flags` are soft concerns for a human.

### Stage 2: AI judgement (`js/services/leaveAi.js`)

The rules result, coverage, and policy are sent as a prompt to a Gemini endpoint on a Cloudflare Worker:

```
POST https://worker8651.reymartcenteno03.workers.dev/api/groovyrey/gemini
body: { prompt, system, temperature: 0, json: true, maxTokens: 400 }
```

The system prompt forces a strict JSON reply: `decision` (approve, reject, or review), `confidence` (0 to 1), `rationale`, and `flags`. The client extracts the JSON object, clamps and normalizes the fields, and has a 20 second timeout.

If the endpoint is unreachable, times out, or returns an unparseable reply, it falls back to a rules-only decision marked `source: "fallback"`. The AI never approves past a hard rule failure.

For local development the endpoint allows only the `groovyrey.github.io` and `localhost` origins.

### Decision router (`js/services/leaveDecision.js`)

`decide(evaluation, ai)` resolves the final status:

- Hard rule failure: `Rejected`, decided by the rules engine.
- AI approve with confidence at least 0.75 and no flags: `Auto-approved`.
- AI reject with confidence at least 0.75: `Rejected`.
- Anything else: `Needs review` for a human.

The view shows every rule result, the AI recommendation with confidence and rationale, and, for requests still waiting, Approve and Reject override buttons.

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
