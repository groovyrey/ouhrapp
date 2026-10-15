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
  getLeaveTypes,
  getLeaveRequests,
  getLeaveBalances,
  getBlackoutDates,
} from "../store.js";

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "Unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function fullName(employee) {
  return `${employee.firstName} ${employee.lastName}`;
}

function personSummary(employee) {
  return {
    name: fullName(employee),
    department: employee.department,
    title: employee.title,
    status: employee.status,
    startDate: employee.startDate,
  };
}

function headcount(employees) {
  const byDepartment = {};
  for (const employee of employees) {
    const bucket = (byDepartment[employee.department] ??= { total: 0, active: 0 });
    bucket.total += 1;
    if (employee.status === "Active") bucket.active += 1;
  }
  return {
    total: employees.length,
    active: employees.filter((e) => e.status === "Active").length,
    byStatus: countBy(employees, "status"),
    byDepartment,
  };
}

function workforce(plans, employees) {
  return plans.map((plan) => {
    const actual = employees.filter(
      (e) => e.department === plan.department && e.status === "Active",
    ).length;
    return { department: plan.department, planned: plan.planned, actual, gap: plan.planned - actual };
  });
}

function recruitment(candidates) {
  return {
    byStage: countBy(candidates, "stage"),
    candidates: candidates.map((c) => ({ name: c.name, role: c.role, stage: c.stage })),
  };
}

function onboarding(onboardings) {
  return onboardings.map((flow) => {
    const tasks = flow.tasks ?? [];
    return {
      name: flow.name,
      role: flow.role,
      startDate: flow.startDate,
      done: tasks.filter((t) => t.done).length,
      total: tasks.length,
      remaining: tasks.filter((t) => !t.done).map((t) => t.label),
    };
  });
}

function attendance(entries) {
  const byEmployee = {};
  for (const entry of entries) {
    const bucket = (byEmployee[entry.employee] ??= { hours: 0, entries: 0, overtime: 0 });
    bucket.hours += entry.hours ?? 0;
    bucket.entries += 1;
    if (entry.note === "Overtime") bucket.overtime += 1;
  }
  return {
    entries: entries.length,
    hoursTotal: Math.round(Object.values(byEmployee).reduce((sum, b) => sum + b.hours, 0) * 10) / 10,
    overtimeCount: entries.filter((e) => e.note === "Overtime").length,
    byEmployee: Object.entries(byEmployee).map(([employee, bucket]) => ({ employee, ...bucket })),
  };
}

function payroll(runs) {
  const sorted = [...runs].sort((a, b) => String(a.period).localeCompare(String(b.period)));
  return {
    latestPeriod: sorted.at(-1)?.period ?? null,
    runs: sorted.map((r) => ({ period: r.period, headcount: r.headcount, status: r.status })),
  };
}

function performance(reviews) {
  const rated = reviews.filter((r) => typeof r.rating === "number");
  const average = rated.length
    ? Math.round((rated.reduce((sum, r) => sum + r.rating, 0) / rated.length) * 100) / 100
    : null;
  return {
    averageRating: average,
    reviews: reviews.map((r) => ({
      employee: r.employee,
      cycle: r.cycle,
      rating: r.rating,
      status: r.status,
    })),
  };
}

function compensation(bands) {
  return {
    bands: bands.map((b) => ({ department: b.department, level: b.level, min: b.min, max: b.max })),
  };
}

function relations(cases) {
  const byTypeStatus = {};
  for (const item of cases) {
    const key = `${item.type} / ${item.status}`;
    byTypeStatus[key] = (byTypeStatus[key] ?? 0) + 1;
  }
  return { total: cases.length, byTypeStatus };
}

function compliance(policies) {
  return {
    policies: policies.map((p) => ({
      name: p.name,
      acknowledged: p.acknowledged,
      total: p.total,
      outstanding: Math.max(0, p.total - p.acknowledged),
    })),
  };
}

function leave(types, requests, balances, blackouts, employees) {
  const nameById = new Map(employees.map((e) => [e.id, fullName(e)]));
  const typeById = new Map(types.map((t) => [t.id, t.name]));
  return {
    types: types.map((t) => ({
      name: t.name,
      paid: t.paid,
      noticeDays: t.noticeDays,
      requiresDoc: t.requiresDoc,
      maxConcurrent: t.maxConcurrent,
    })),
    blackoutDates: blackouts.map((b) => ({ label: b.label, from: b.from, to: b.to })),
    pending: requests.filter(
      (r) => !["Approved", "Auto-approved", "Rejected"].includes(r.status),
    ).length,
    requests: requests.map((r) => ({
      employee: r.employeeName ?? nameById.get(r.employeeId) ?? "Unknown",
      type: typeById.get(r.typeId) ?? r.typeId,
      start: r.startDate,
      end: r.endDate,
      days: r.days,
      status: r.status,
      reason: r.reason || "",
    })),
    balances: balances.map((b) => ({
      employee: nameById.get(b.employeeId) ?? "Unknown",
      type: typeById.get(b.typeId) ?? b.typeId,
      remaining: Math.max(0, (b.accrued ?? 0) - (b.used ?? 0)),
    })),
  };
}

export function buildContext() {
  const employees = getEmployees();
  return {
    generatedAt: new Date().toISOString(),
    departments: getDepartments(),
    headcount: headcount(employees),
    people: employees.map(personSummary),
    workforce: workforce(getPlans(), employees),
    recruitment: recruitment(getCandidates()),
    onboarding: onboarding(getOnboardings()),
    attendance: attendance(getTimeEntries()),
    payroll: payroll(getPayrollRuns()),
    performance: performance(getReviews()),
    compensation: compensation(getSalaryBands()),
    relations: relations(getCases()),
    compliance: compliance(getPolicies()),
    leave: leave(
      getLeaveTypes(),
      getLeaveRequests(),
      getLeaveBalances(),
      getBlackoutDates(),
      employees,
    ),
  };
}
