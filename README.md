# ouhrapp

Static prototype built with plain HTML, CSS, and JavaScript.

## Run

Open `index.html` directly, or serve the folder:

```
npx serve .
```

## Structure

```
index.html            app shell (topbar, sidebar, main)
css/style.css         theme tokens, base, fonts
css/app-shell.css     shell layout and mobile drawer
css/views.css         tables, forms, buttons
js/main.js            app entry
js/index.js           js barrel
js/router.js          hash router
js/nav.js             sidebar drawer behavior
js/store.js           data access with localStorage
js/seed.js            mock seed data
js/views/             one file per module
js/components/        shared components
js/utils/             helpers
assets/               images and static files
```

## Modules

All modules are implemented with mock data persisted to localStorage:

workforce planning, recruitment, onboarding, employees, leave automation,
time and attendance, payroll, performance, compensation, relations and
compliance, reports, administration, plus the dashboard.

## Leave automation

Leave requests are evaluated in two stages. A deterministic rules engine checks
balance, notice period, required documents, blackout windows, and team coverage.
The fuzzy judgement is then sent to a Gemini endpoint on the worker8651
Cloudflare Worker (`/api/groovyrey/gemini`), which returns a structured
recommendation, confidence, rationale, and flags. The decision router
auto-approves clean routine requests, rejects any hard-rule failure, and routes
flagged or low-confidence cases to a human. If the endpoint is unreachable or
returns an unparseable reply, the app falls back to a rules-only decision.

For local dev, the endpoint only allows the `groovyrey.github.io` and
`localhost` origins.

## Dev server

```
./serve.py 3000     # no-cache, or:
servelive 3000 .    # no-cache + live reload
```
