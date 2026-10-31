# Modules

ouhrapp is organized as fourteen feature modules plus a shared infrastructure layer. Each feature module is a view function in `js/views/`, registered in the route table in `js/router.js` and collected by `js/views/index.js`. Every module renders through `js/components/` and reads or writes through `js/store.js`, the only module that touches persisted data.

## Feature modules

| Module | Route | Primary data | What it does |
| --- | --- | --- | --- |
| Dashboard | `#/dashboard` | employees, plans, candidates | Read-only headcount snapshot and per-department counts. |
| Manager assistant | `#/assistant` | `localStorage` key `ouhrapp:assistant:v1` | Chat over a redacted data snapshot, streamed from the assistant worker, with a local digest as fallback. |
| Workforce planning | `#/workforce` | plans | Planned versus actual headcount per department, editable target, and the resulting gap. Calls `getPlans` and `updatePlan`. |
| Recruitment | `#/recruitment` | candidates | Kanban pipeline across Applied, Screening, Interview, Offer, and Hired. Calls `getCandidates`, `addCandidate`, and `moveCandidate`. |
| Onboarding | `#/onboarding` | onboardings | Per-new-hire task checklists with a progress bar. Calls `getOnboardings` and `toggleTask`. |
| Employees | `#/employees` | employees | Directory table with search, create, edit, and delete. Calls `getEmployees`, `getEmployee`, `addEmployee`, `updateEmployee`, and `removeEmployee`. |
| Leave | `#/leave` | leaveTypes, leaveRequests, leaveBalances, blackoutDates | Request intake and manager approval, balances committed on approval, and the policy carried in the types. Calls `getLeaveTypes`, `getLeaveRequests`, `getLeaveBalances`, `getBlackoutDates`, `getBalance`, `addLeaveRequest`, `updateLeaveRequest`, and `commitLeave`. |
| Time and attendance | `#/attendance` | timeEntries | Clock in and out, manual entry, running totals, and overtime. Calls `getTimeEntries` and `addTimeEntry`. |
| Payroll | `#/payroll` | payrollRuns | Monthly run drafts computed from active employees. Calls `getPayrollRuns` and `runPayroll`. |
| Performance | `#/performance` | reviews | Review cycles with editable ratings and averages. Calls `getReviews` and `setReviewRating`. |
| Compensation | `#/compensation` | salaryBands, employees | Salary bands and current salaries, read-only. Calls `getSalaryBands` and `getEmployees`. |
| Relations and compliance | `#/relations` | cases, policies | Case log with status and policy acknowledgment tracking. Calls `getCases`, `getPolicies`, `setCaseStatus`, and `acknowledgePolicy`. |
| Reports | `#/reports` | aggregates from the other modules | Read-only headcount bars by department and status, plus an average salary table. |
| Administration | `#/admin` | users | User list with role assignment, plus reset demo data. Calls `getUsers`, `addUser`, `removeUser`, `setUserRole`, and `resetData`. |

## Shared infrastructure

| Layer | Path | Role |
| --- | --- | --- |
| Boot | `js/main.js` | Starts auth, the shell, and the router. |
| Router | `js/router.js` | Maps the hash to a view, sets the page title, and emits `route:change`. |
| Shell and nav | `index.html`, `js/nav.js` | Top bar, account block, and drawer with a focus trap and active link. |
| Auth | `js/auth/session.js`, `js/views/login.js` | Client-side gate with the demo `admin` account and a session flag in `localStorage`. |
| Store | `js/store.js` | Single read/write gate over state, persisted to `localStorage` under `ouhrapp:data:v1`. |
| Seed | `js/seed.js` | Mock records, departments, and pipeline stages. |
| Components | `js/components/` | `renderTable`, `renderBars`, `viewHead`, `field`, `card`, `panel`, `kv`, and `emptyState`. |
| Services | `js/services/assistantContext.js`, `js/services/assistant.js`, `js/services/tools.js` | Redacted assistant context, the streaming network client, and the assistant's tool definitions. |
| Utilities | `js/utils/format.js`, `js/utils/markdown.js` | `escapeHtml`, `formatDate`, `formatMoney`, `diffDays`, and the assistant's Markdown renderer. |

## Boundaries

Views render markup and delegate every state change to a store function, so no view touches `localStorage` or the network directly. The manager assistant is the only module that leaves the browser, and it reaches the worker through `js/services/assistant.js` while the data it may see is limited by `js/services/assistantContext.js`. Adding a module means adding a view under `js/views/`, exporting it from `js/views/index.js`, and adding a route entry in `js/router.js`, without editing the other modules.
