import {
  getEmployees,
  getDepartments,
  getPlans,
  getCandidates,
  getOnboardings,
  getTimeEntries,
  getPayrollRuns,
  getReviews,
  getSalaryBands,
  getCases,
  getPolicies,
  getLeaveRequests,
  getLeaveBalances,
  getLeaveTypes,
} from "../store.js";

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "Unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

const nameOf = (e) => `${e.firstName} ${e.lastName}`;

export const TOOLS = [
  {
    name: "headcount",
    label: "Reading employees",
    description: "headcount by department and status",
    run() {
      const e = getEmployees();
      return {
        total: e.length,
        active: e.filter((x) => x.status === "Active").length,
        byDepartment: countBy(e, "department"),
        byStatus: countBy(e, "status"),
      };
    },
  },
  {
    name: "employees",
    label: "Reading employee directory",
    description: "employee list with name, department, title, status",
    run(args = {}) {
      let e = getEmployees();
      if (args.department) e = e.filter((x) => x.department === args.department);
      if (args.status) e = e.filter((x) => x.status === args.status);
      return e.map((x) => ({
        name: nameOf(x),
        department: x.department,
        title: x.title,
        status: x.status,
        startDate: x.startDate,
      }));
    },
  },
  {
    name: "workforce",
    label: "Reading workforce plan",
    description: "planned vs actual active headcount per department",
    run() {
      const e = getEmployees();
      return getPlans().map((p) => ({
        department: p.department,
        planned: p.planned,
        actual: e.filter((x) => x.department === p.department && x.status === "Active").length,
      }));
    },
  },
  {
    name: "recruitment",
    label: "Reading recruitment pipeline",
    description: "candidates by hiring stage",
    run() {
      const c = getCandidates();
      return { total: c.length, byStage: countBy(c, "stage"), candidates: c };
    },
  },
  {
    name: "onboarding",
    label: "Reading onboarding",
    description: "onboarding checklist progress per new hire",
    run() {
      return getOnboardings().map((o) => ({
        name: o.name,
        role: o.role,
        startDate: o.startDate,
        done: o.tasks.filter((t) => t.done).length,
        total: o.tasks.length,
        openTasks: o.tasks.filter((t) => !t.done).map((t) => t.label),
      }));
    },
  },
  {
    name: "attendance",
    label: "Reading time and attendance",
    description: "hours and overtime by employee",
    run() {
      const by = {};
      for (const entry of getTimeEntries()) {
        const b = (by[entry.employee] ??= { hours: 0, overtime: 0 });
        b.hours += entry.hours ?? 0;
        if (entry.note === "Overtime") b.overtime += 1;
      }
      return {
        entries: getTimeEntries().length,
        byEmployee: Object.entries(by).map(([employee, b]) => ({ employee, ...b })),
      };
    },
  },
  {
    name: "payroll",
    label: "Reading payroll",
    description: "payroll runs by period with status",
    run() {
      return getPayrollRuns().map((r) => ({
        period: r.period,
        headcount: r.headcount,
        gross: r.gross,
        net: r.net,
        status: r.status,
      }));
    },
  },
  {
    name: "performance",
    label: "Reading performance",
    description: "performance review ratings per employee",
    run() {
      const rated = getReviews().filter((r) => typeof r.rating === "number");
      const avg = rated.length
        ? Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length) * 100) / 100
        : null;
      return { averageRating: avg, reviews: getReviews() };
    },
  },
  {
    name: "compensation",
    label: "Reading compensation",
    description: "salary bands by department and level",
    run() {
      return getSalaryBands().map((b) => ({
        department: b.department,
        level: b.level,
        min: b.min,
        max: b.max,
      }));
    },
  },
  {
    name: "relations",
    label: "Reading relations and compliance",
    description: "employee relations cases by type and status",
    run() {
      const c = getCases();
      return { total: c.length, byTypeStatus: countBy(c, "type"), cases: c };
    },
  },
  {
    name: "compliance",
    label: "Reading compliance policies",
    description: "policy acknowledgment status with outstanding counts",
    run() {
      return getPolicies().map((p) => ({
        name: p.name,
        acknowledged: p.acknowledged,
        total: p.total,
        outstanding: Math.max(0, p.total - p.acknowledged),
      }));
    },
  },
  {
    name: "leave_requests",
    label: "Reading leave requests",
    description: "leave requests with status and dates",
    run(args = {}) {
      let r = getLeaveRequests();
      if (args.status) r = r.filter((x) => x.status === args.status);
      const typeById = new Map(getLeaveTypes().map((t) => [t.id, t.name]));
      const nameById = new Map(getEmployees().map((e) => [e.id, nameOf(e)]));
      return r.map((x) => ({
        employee: x.employeeName ?? nameById.get(x.employeeId) ?? "Unknown",
        type: typeById.get(x.typeId) ?? x.typeId,
        start: x.startDate,
        end: x.endDate,
        days: x.days,
        status: x.status,
        reason: x.reason || "",
      }));
    },
  },
  {
    name: "leave_balances",
    label: "Reading leave balances",
    description: "remaining leave balance per employee and type",
    run() {
      const nameById = new Map(getEmployees().map((e) => [e.id, nameOf(e)]));
      const typeById = new Map(getLeaveTypes().map((t) => [t.id, t.name]));
      return getLeaveBalances().map((b) => ({
        employee: nameById.get(b.employeeId) ?? "Unknown",
        type: typeById.get(b.typeId) ?? b.typeId,
        remaining: Math.max(0, (b.accrued ?? 0) - (b.used ?? 0)),
      }));
    },
  },
  {
    name: "leave_types",
    label: "Reading leave rules",
    description: "leave types with pay, notice and doc rules",
    run() {
      return getLeaveTypes().map((t) => ({
        name: t.name,
        paid: t.paid,
        noticeDays: t.noticeDays,
        requiresDoc: t.requiresDoc,
        maxConcurrent: t.maxConcurrent,
      }));
    },
  },
  {
    name: "departments",
    label: "Reading departments",
    description: "list of departments",
    run() {
      return getDepartments();
    },
  },
];

const byName = new Map(TOOLS.map((t) => [t.name, t]));

export function getTool(name) {
  return byName.get(name) ?? null;
}

export function toolList() {
  return TOOLS.map((t) => `- ${t.name}: ${t.description}`).join("\n");
}
