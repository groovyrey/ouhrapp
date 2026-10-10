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

All 12 modules are implemented with mock data persisted to localStorage:

workforce planning, recruitment, onboarding, employees, time and attendance,
payroll, performance, compensation, relations and compliance, reports,
administration, plus the dashboard.

## Dev server

```
./serve.py 3000     # no-cache, or:
servelive 3000 .    # no-cache + live reload
```
