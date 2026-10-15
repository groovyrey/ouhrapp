# DFD: Data Flow Diagram

This document models how data moves through ouhrapp. It uses a Gane and Sarson style notation, rendered with Mermaid, and covers the system at two levels: the context diagram (Level 0) and the top-level decomposition (Level 1).

## Notation

| Symbol | Meaning | Mermaid shape |
| --- | --- | --- |
| Rectangle | External entity, a source or sink of data outside the system | `[Entity]` |
| Rounded rectangle | Process that transforms data | `("n.0 Process")` |
| Open-ended rectangle | Data store | `[("Dn store")]` |
| Arrow | Data flow, labelled with the data carried | `-->|label|` |

## Level 0: Context diagram

The system is a single process. External entities exchange data with it.

```mermaid
flowchart LR
  EMP[Employee]
  MGR[Manager]
  HRO[HR Officer]
  PAYO[Payroll Officer]
  ADM[Administrator]
  APP[Applicant]
  AI[[AI Service]]
  MAIL[[Email and Notification Service]]
  PROV[[Payroll Provider]]

  SYS("0. ouhrapp HRMS")

  EMP -->|credentials, leave request, time events, profile data| SYS
  SYS -->|approvals, leave balances, payslips, notifications| EMP

  MGR -->|approvals, review ratings, headcount input, assistant questions| SYS
  SYS -->|team requests, coverage warnings, reports, assistant advice| MGR

  HRO -->|employee records, policies, relation cases| SYS
  SYS -->|directory, acknowledgments, compliance status| HRO

  PAYO -->|payroll run input| SYS
  SYS -->|run drafts, cost reports| PAYO

  ADM -->|users, roles, settings| SYS
  SYS -->|audit log, access summary| ADM

  APP -->|application, resume| SYS
  SYS -->|stage updates, offers| APP

  SYS -->|manager question and non-private context| AI
  AI -->|advice, summary, recommendation| SYS

  SYS -->|invites, approvals, alerts| MAIL

  SYS <-->|run submission, payslip documents| PROV
```

## Level 1: Top-level decomposition

The system decomposes into thirteen processes and a set of data stores. External entities shown are the primary ones.

```mermaid
flowchart TB
  EMP[Employee]
  MGR[Manager]
  HRO[HR Officer]
  PAYO[Payroll Officer]
  ADM[Administrator]
  APP[Applicant]
  AI[[AI Service]]
  MAIL[[Email Service]]

  P1("1.0 Manage employees")
  P2("2.0 Plan workforce")
  P3("3.0 Manage recruitment")
  P4("4.0 Run onboarding")
  P5("5.0 Manage leave")
  P6("6.0 Track attendance")
  P7("7.0 Run payroll")
  P8("8.0 Manage performance")
  P9("9.0 Manage compensation")
  P10("10.0 Track relations and compliance")
  P11("11.0 Produce reports")
  P12("12.0 Administer access")
  P13("13.0 Advise manager")

  D1[("D1 employees")]
  D2[("D2 candidates")]
  D3[("D3 onboarding")]
  D4[("D4 time entries")]
  D5[("D5 payroll")]
  D6[("D6 reviews")]
  D7[("D7 salary bands")]
  D8[("D8 cases")]
  D9[("D9 policies")]
  D10[("D10 leave types and balances")]
  D11[("D11 leave requests and decisions")]
  D12[("D12 users and sessions")]
  D13[("D13 audit log")]
  D14[("D14 blackout dates")]
  D15[("D15 assistant conversations")]

  HRO --> P1
  P1 --> D1
  MGR --> P2
  P2 --> D1
  P2 --> P11
  APP --> P3
  P3 --> D2
  HRO --> P4
  P4 --> D3
  EMP -->|leave request| P5
  P5 --> D10
  P5 --> D11
  P5 --> D14
  MGR -->|decision| P5
  P5 -->|notices| MAIL
  EMP -->|clock and time| P6
  P6 --> D4
  PAYO --> P7
  P7 --> D5
  P7 --> D1
  MGR --> P8
  P8 --> D6
  HRO --> P9
  P9 --> D7
  HRO --> P10
  P10 --> D8
  P10 --> D9
  ADM --> P12
  P12 --> D12
  MGR -->|question| P13
  P13 -->|question and non-private context| AI
  AI -->|advice| P13
  P13 --> D15
  P13 -->|advice| MGR
  D1 --> P13
  D2 --> P13
  D4 --> P13
  D5 --> P13
  D6 --> P13
  D10 --> P13
  D11 --> P13
  D1 --> P11
  D2 --> P11
  D4 --> P11
  D5 --> P11
  D6 --> P11
  D11 --> P11
  P1 --> D13
  P5 --> D13
  P7 --> D13
  P12 --> D13
  P13 --> D13
  ADM -->|review| D13
```

## Process descriptions

| Process | Name | Input | Output | Stores |
| --- | --- | --- | --- | --- |
| 1.0 | Manage employees | Employee records from HR, edits | Directory entries, change history | D1, D13 |
| 2.0 | Plan workforce | Headcount targets from Manager | Plan vs actual, gap | D1, D11 |
| 3.0 | Manage recruitment | Applications, stage moves | Candidate pipeline, stage events | D2 |
| 4.0 | Run onboarding | New hire, template | Task checklist, progress | D3 |
| 5.0 | Manage leave | Leave request, balances, blackout windows, manager decision | Approved or rejected request, updated balance | D10, D11, D14, D13 |
| 6.0 | Track attendance | Clock events, manual entries | Hours, approval state | D4 |
| 7.0 | Run payroll | Salaries, pay period | Run draft, payslips | D5, D1, D13 |
| 8.0 | Manage performance | Cycle, ratings | Review records | D6 |
| 9.0 | Manage compensation | Bands, adjustments | Salary band set, history | D7 |
| 10.0 | Track relations and compliance | Cases, policy events | Case log, acknowledgments | D8, D9 |
| 11.0 | Produce reports | Aggregated data | Dashboards, exports | reads D1, D2, D4, D5, D6, D11 |
| 12.0 | Administer access | Users, roles, invites | Memberships, sessions | D12, D13 |
| 13.0 | Advise manager | Manager question, non-private snapshot | Advice, summary, recommendation | D15, D13; reads D1, D2, D4, D5, D6, D10, D11 |

## Data stores

| Store | Holds | Written by | Read by |
| --- | --- | --- | --- |
| D1 employees | Employee records and departments | 1.0, 4.0, 7.0 | 1.0, 2.0, 5.0, 7.0, 11.0, 13.0 |
| D2 candidates | Candidates and stage events | 3.0 | 3.0, 11.0, 13.0 |
| D3 onboarding | Onboarding flows and tasks | 4.0 | 4.0, 11.0 |
| D4 time entries | Time and attendance rows | 6.0 | 6.0, 7.0, 11.0, 13.0 |
| D5 payroll | Payroll runs and payslips | 7.0 | 7.0, 11.0, 13.0 |
| D6 reviews | Review cycles and reviews | 8.0 | 8.0, 11.0, 13.0 |
| D7 salary bands | Salary bands and adjustments | 9.0 | 9.0, 7.0 |
| D8 cases | Relation cases and events | 10.0 | 10.0 |
| D9 policies | Policies and acknowledgments | 10.0 | 10.0, 11.0 |
| D10 leave types and balances | Leave policy and balances | 5.0 | 5.0, 13.0 |
| D11 leave requests and decisions | Leave requests and their final decisions | 5.0 | 2.0, 5.0, 11.0, 13.0 |
| D12 users and sessions | Users, memberships, sessions, invites | 12.0 | all processes |
| D13 audit log | One row per mutation | 1.0, 5.0, 7.0, 12.0, 13.0 | 11.0, 12.0 |
| D14 blackout dates | Company and department blackout windows | 5.0 | 5.0 |
| D15 assistant conversations | Chat turns per manager | 13.0 | 13.0 |

## Key data flows

| Flow | From | To | Data |
| --- | --- | --- | --- |
| Leave request | Employee | 5.0 Manage leave | Type, dates, days, reason |
| Leave decision | Manager | 5.0 Manage leave | Approve or reject |
| Decision record | 5.0 Manage leave | D11 | Final status, deciding actor, timestamp |
| Assistant question | Manager | 13.0 Advise manager | Natural language question |
| Assistant context | 13.0 Advise manager | AI Service | Question, recent turns, non-private snapshot of the stores |
| Assistant advice | AI Service | 13.0 Advise manager | Answer, summary, recommendation |
| Conversation | 13.0 Advise manager | D15 | Turns with role, source, and model |
| Attendance | Employee | 6.0 Track attendance | Clock in and out, manual entries |
| Payroll run | Payroll Officer | 7.0 Run payroll | Pay period, inclusion set |
| Report query | Reports consumer | 11.0 Produce reports | Filter and scope |
| Audit entry | Mutating processes | D13 | Actor, entity, action, before, after |

## Notes on the runtime call

The AI Service is a secondary actor, not a data store. In the prototype the browser calls the Gemini endpoint on a Cloudflare Worker directly, sending the manager question, the recent turns, and a non-private snapshot of the stores. In production the same flow is issued server side so the key never ships to the client, with per-tenant rate limiting and a short cache. On timeout or an empty reply the flow short-circuits to a local snapshot summary marked as a fallback, so the AI path is never on the critical path for correctness. The assistant only advises; the manager still makes and records every decision.
