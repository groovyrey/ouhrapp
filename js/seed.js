export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "People",
  "Finance",
  "Support",
];

export const STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired"];

export const seed = {
  employees: [
    { id: "e1", firstName: "Rey", lastName: "Centeno", email: "rey@ouhrapp.dev", department: "Engineering", title: "Staff Engineer", status: "Active", startDate: "2022-03-14", salary: 145000 },
    { id: "e2", firstName: "Mara", lastName: "Ibarra", email: "mara@ouhrapp.dev", department: "People", title: "HR Manager", status: "Active", startDate: "2021-07-01", salary: 92000 },
    { id: "e3", firstName: "Sofia", lastName: "Reyes", email: "sofia@ouhrapp.dev", department: "Sales", title: "Account Executive", status: "On leave", startDate: "2023-01-09", salary: 78000 },
    { id: "e4", firstName: "Noah", lastName: "Tan", email: "noah@ouhrapp.dev", department: "Engineering", title: "Backend Engineer", status: "Active", startDate: "2023-05-22", salary: 118000 },
    { id: "e5", firstName: "Lena", lastName: "Ortiz", email: "lena@ouhrapp.dev", department: "Marketing", title: "Content Lead", status: "Active", startDate: "2022-11-02", salary: 88000 },
    { id: "e6", firstName: "Gabriel", lastName: "Santos", email: "gabriel@ouhrapp.dev", department: "Finance", title: "Payroll Officer", status: "Active", startDate: "2020-02-17", salary: 76000 },
    { id: "e7", firstName: "Priya", lastName: "Nair", email: "priya@ouhrapp.dev", department: "Support", title: "Support Lead", status: "Inactive", startDate: "2019-09-30", salary: 65000 },
    { id: "e8", firstName: "Diego", lastName: "Cruz", email: "diego@ouhrapp.dev", department: "Engineering", title: "Frontend Engineer", status: "Active", startDate: "2024-04-08", salary: 105000 },
  ],

  plans: [
    { id: "p1", department: "Engineering", planned: 14 },
    { id: "p2", department: "Sales", planned: 9 },
    { id: "p3", department: "Marketing", planned: 6 },
    { id: "p4", department: "People", planned: 5 },
    { id: "p5", department: "Finance", planned: 4 },
    { id: "p6", department: "Support", planned: 6 },
  ],

  candidates: [
    { id: "c1", name: "Andrea Lim", role: "Backend Engineer", stage: "Applied" },
    { id: "c2", name: "Mark Villanueva", role: "Account Executive", stage: "Screening" },
    { id: "c3", name: "Jo Ruiz", role: "Product Designer", stage: "Interview" },
    { id: "c4", name: "Hana Sato", role: "Data Analyst", stage: "Interview" },
    { id: "c5", name: "Ben Ocampo", role: "Support Specialist", stage: "Offer" },
    { id: "c6", name: "Tess Gomez", role: "Frontend Engineer", stage: "Hired" },
  ],

  onboardings: [
    { id: "o1", name: "Tess Gomez", role: "Frontend Engineer", startDate: "2026-10-20", tasks: [
      { id: "t1", label: "Sign contract", done: true },
      { id: "t2", label: "Issue equipment", done: false },
      { id: "t3", label: "Create accounts", done: false },
      { id: "t4", label: "Schedule orientation", done: false },
    ] },
    { id: "o2", name: "Ben Ocampo", role: "Support Specialist", startDate: "2026-11-03", tasks: [
      { id: "t1", label: "Sign contract", done: true },
      { id: "t2", label: "Issue equipment", done: true },
      { id: "t3", label: "Create accounts", done: false },
      { id: "t4", label: "Schedule orientation", done: false },
    ] },
    { id: "o3", name: "Rae Flores", role: "Marketing Associate", startDate: "2026-11-17", tasks: [
      { id: "t1", label: "Sign contract", done: false },
      { id: "t2", label: "Issue equipment", done: false },
      { id: "t3", label: "Create accounts", done: false },
      { id: "t4", label: "Schedule orientation", done: false },
    ] },
  ],

  timeEntries: [
    { id: "a1", employee: "Rey Centeno", date: "2026-10-08", hours: 8, note: "Regular" },
    { id: "a2", employee: "Rey Centeno", date: "2026-10-09", hours: 7.5, note: "Regular" },
    { id: "a3", employee: "Mara Ibarra", date: "2026-10-09", hours: 8, note: "Regular" },
    { id: "a4", employee: "Noah Tan", date: "2026-10-09", hours: 9, note: "Overtime" },
    { id: "a5", employee: "Lena Ortiz", date: "2026-10-09", hours: 6, note: "Half day" },
  ],

  payrollRuns: [
    { id: "r1", period: "2026-08", headcount: 8, gross: 767000, net: 598260, status: "Paid" },
    { id: "r2", period: "2026-09", headcount: 8, gross: 767000, net: 598260, status: "Paid" },
    { id: "r3", period: "2026-10", headcount: 8, gross: 767000, net: 598260, status: "Draft" },
  ],

  reviews: [
    { id: "v1", employee: "Rey Centeno", cycle: "2026 H1", rating: 5, status: "Closed" },
    { id: "v2", employee: "Noah Tan", cycle: "2026 H1", rating: 4, status: "Closed" },
    { id: "v3", employee: "Lena Ortiz", cycle: "2026 H2", rating: 4, status: "Submitted" },
    { id: "v4", employee: "Diego Cruz", cycle: "2026 H2", rating: 3, status: "Open" },
    { id: "v5", employee: "Sofia Reyes", cycle: "2026 H2", rating: 4, status: "Open" },
  ],

  salaryBands: [
    { id: "b1", department: "Engineering", level: "Junior", min: 70000, max: 95000 },
    { id: "b2", department: "Engineering", level: "Mid", min: 95000, max: 125000 },
    { id: "b3", department: "Engineering", level: "Senior", min: 125000, max: 175000 },
    { id: "b4", department: "Sales", level: "Junior", min: 55000, max: 75000 },
    { id: "b5", department: "Sales", level: "Senior", min: 90000, max: 130000 },
    { id: "b6", department: "People", level: "Mid", min: 75000, max: 100000 },
  ],

  cases: [
    { id: "k1", subject: "Schedule conflict", employee: "Sofia Reyes", type: "Mediation", status: "Resolved", opened: "2026-09-02" },
    { id: "k2", subject: "Attendance warning", employee: "Priya Nair", type: "Disciplinary", status: "Investigating", opened: "2026-09-19" },
    { id: "k3", subject: "Equipment dispute", employee: "Lena Ortiz", type: "Grievance", status: "Open", opened: "2026-10-01" },
  ],

  policies: [
    { id: "y1", name: "Code of conduct", acknowledged: 7, total: 8 },
    { id: "y2", name: "Data privacy", acknowledged: 6, total: 8 },
    { id: "y3", name: "Remote work", acknowledged: 8, total: 8 },
    { id: "y4", name: "Security awareness", acknowledged: 4, total: 8 },
  ],

  users: [
    { id: "u1", name: "Rey Centeno", email: "rey@ouhrapp.dev", role: "Administrator" },
    { id: "u2", name: "Mara Ibarra", email: "mara@ouhrapp.dev", role: "HR" },
    { id: "u3", name: "Gabriel Santos", email: "gabriel@ouhrapp.dev", role: "Payroll officer" },
    { id: "u4", name: "Lena Ortiz", email: "lena@ouhrapp.dev", role: "Manager" },
    { id: "u5", name: "Noah Tan", email: "noah@ouhrapp.dev", role: "Employee" },
  ],

  leaveTypes: [
    { id: "t-vac", name: "Vacation", paid: true, noticeDays: 5, requiresDoc: false, maxConcurrent: 2 },
    { id: "t-sick", name: "Sick", paid: true, noticeDays: 0, requiresDoc: true, maxConcurrent: 4 },
    { id: "t-per", name: "Personal", paid: false, noticeDays: 2, requiresDoc: false, maxConcurrent: 3 },
    { id: "t-bereave", name: "Bereavement", paid: true, noticeDays: 0, requiresDoc: false, maxConcurrent: 3 },
  ],

  blackoutDates: [
    { label: "Year-end close", from: "2026-12-24", to: "2026-12-31" },
    { label: "Mid-year close", from: "2026-06-29", to: "2026-06-30" },
  ],

  leaveBalances: [
    { employeeId: "e1", typeId: "t-vac", accrued: 15, used: 4 },
    { employeeId: "e1", typeId: "t-sick", accrued: 10, used: 2 },
    { employeeId: "e1", typeId: "t-per", accrued: 5, used: 1 },
    { employeeId: "e2", typeId: "t-vac", accrued: 15, used: 7 },
    { employeeId: "e2", typeId: "t-sick", accrued: 10, used: 1 },
    { employeeId: "e2", typeId: "t-per", accrued: 5, used: 2 },
    { employeeId: "e3", typeId: "t-vac", accrued: 12, used: 5 },
    { employeeId: "e3", typeId: "t-sick", accrued: 10, used: 3 },
    { employeeId: "e3", typeId: "t-per", accrued: 5, used: 0 },
    { employeeId: "e4", typeId: "t-vac", accrued: 12, used: 2 },
    { employeeId: "e4", typeId: "t-sick", accrued: 10, used: 3 },
    { employeeId: "e4", typeId: "t-per", accrued: 5, used: 1 },
    { employeeId: "e5", typeId: "t-vac", accrued: 14, used: 6 },
    { employeeId: "e5", typeId: "t-sick", accrued: 10, used: 0 },
    { employeeId: "e5", typeId: "t-per", accrued: 5, used: 2 },
    { employeeId: "e6", typeId: "t-vac", accrued: 18, used: 9 },
    { employeeId: "e6", typeId: "t-sick", accrued: 10, used: 2 },
    { employeeId: "e6", typeId: "t-per", accrued: 5, used: 3 },
    { employeeId: "e7", typeId: "t-vac", accrued: 16, used: 11 },
    { employeeId: "e8", typeId: "t-vac", accrued: 12, used: 3 },
    { employeeId: "e8", typeId: "t-sick", accrued: 10, used: 1 },
    { employeeId: "e8", typeId: "t-per", accrued: 5, used: 0 },
  ],

  leaveRequests: [
    {
      id: "lr3",
      employeeId: "e5",
      employeeName: "Lena Ortiz",
      typeId: "t-per",
      startDate: "2026-10-20",
      endDate: "2026-10-21",
      days: 2,
      reason: "Personal errand",
      status: "Needs review",
      submittedAt: "2026-10-09",
      decision: {
        final: "Needs review",
        decidedBy: "Pending human",
        decidedAt: "2026-10-09",
        rules: [
          { id: "balance", label: "Balance", status: "pass", detail: "3 day(s) available, 2 requested" },
          { id: "coverage", label: "Team coverage", status: "pass", detail: "0 teammate(s) already off, limit 3" },
        ],
        ai: { decision: "review", confidence: 0.58, rationale: "Unpaid personal leave with minimal notice; a manager should confirm coverage.", flags: ["Short notice"], source: "ai", model: "gemma-4-26b-a4b-it" },
      },
    },
    {
      id: "lr2",
      employeeId: "e4",
      employeeName: "Noah Tan",
      typeId: "t-sick",
      startDate: "2026-10-06",
      endDate: "2026-10-08",
      days: 3,
      reason: "Flu",
      status: "Approved",
      submittedAt: "2026-10-06",
      decision: {
        final: "Approved",
        decidedBy: "Mara Ibarra",
        decidedAt: "2026-10-06",
        rules: [
          { id: "balance", label: "Balance", status: "pass", detail: "7 day(s) available, 3 requested" },
          { id: "document", label: "Supporting document", status: "flag", detail: "Medical certificate required for absences over 2 days" },
        ],
        ai: { decision: "review", confidence: 0.66, rationale: "Sick leave over two days needs a medical certificate on file.", flags: ["Medical certificate pending"], source: "ai", model: "gemma-4-26b-a4b-it" },
      },
    },
    {
      id: "lr1",
      employeeId: "e3",
      employeeName: "Sofia Reyes",
      typeId: "t-vac",
      startDate: "2026-10-12",
      endDate: "2026-10-16",
      days: 5,
      reason: "Family trip",
      status: "Auto-approved",
      submittedAt: "2026-09-28",
      decision: {
        final: "Auto-approved",
        decidedBy: "System (AI)",
        decidedAt: "2026-09-28",
        rules: [
          { id: "balance", label: "Balance", status: "pass", detail: "7 day(s) available, 5 requested" },
          { id: "notice", label: "Notice period", status: "pass", detail: "Vacation prefers 5 day(s) notice, 14 given" },
          { id: "coverage", label: "Team coverage", status: "pass", detail: "0 teammate(s) already off, limit 2" },
        ],
        ai: { decision: "approve", confidence: 0.86, rationale: "Routine vacation within balance, full notice given, team coverage is fine.", flags: [], source: "ai", model: "gemma-4-26b-a4b-it" },
      },
    },
  ],
};
