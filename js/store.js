import { seed, DEPARTMENTS, STAGES } from "./seed.js";

const STORAGE_KEY = "ouhrapp:data:v1";

let state = load();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...clone(seed), ...JSON.parse(raw) };
  } catch (error) {
    console.warn("ouhrapp: failed to read stored data", error);
  }
  return clone(seed);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("ouhrapp: failed to save data", error);
  }
}

function uid() {
  return crypto.randomUUID();
}

export function resetData() {
  state = clone(seed);
  persist();
}

export { DEPARTMENTS, STAGES };

// Employees
export const getDepartments = () => [...DEPARTMENTS];
export const getEmployees = () => state.employees;
export const getEmployee = (id) => state.employees.find((e) => e.id === id) ?? null;
export function addEmployee(employee) {
  state.employees.unshift(employee);
  persist();
}
export function updateEmployee(id, patch) {
  Object.assign(state.employees.find((e) => e.id === id) ?? {}, patch);
  persist();
}
export function removeEmployee(id) {
  state.employees = state.employees.filter((e) => e.id !== id);
  persist();
}

// Workforce planning
export const getPlans = () => state.plans;
export function updatePlan(id, planned) {
  const plan = state.plans.find((p) => p.id === id);
  if (plan) {
    plan.planned = planned;
    persist();
  }
}

// Recruitment
export const getCandidates = () => state.candidates;
export function addCandidate(candidate) {
  state.candidates.push({ id: uid(), ...candidate });
  persist();
}
export function moveCandidate(id, direction) {
  const candidate = state.candidates.find((c) => c.id === id);
  if (!candidate) return;
  const index = STAGES.indexOf(candidate.stage);
  const next = index + direction;
  if (next < 0 || next >= STAGES.length) return;
  candidate.stage = STAGES[next];
  persist();
}

// Onboarding
export const getOnboardings = () => state.onboardings;
export function toggleTask(onboardingId, taskId) {
  const onboarding = state.onboardings.find((o) => o.id === onboardingId);
  const task = onboarding?.tasks.find((t) => t.id === taskId);
  if (task) {
    task.done = !task.done;
    persist();
  }
}

// Time and attendance
export const getTimeEntries = () => state.timeEntries;
export function addTimeEntry(entry) {
  state.timeEntries.unshift({ id: uid(), ...entry });
  persist();
}

// Payroll
export const getPayrollRuns = () => state.payrollRuns;
export function runPayroll() {
  const employees = state.employees.filter((e) => e.status === "Active");
  const gross = employees.reduce((sum, e) => sum + (e.salary ?? 0), 0) / 12;
  const round = (n) => Math.round(n);
  const periods = state.payrollRuns.map((r) => r.period).sort();
  const [year, month] = (periods.at(-1) ?? "2026-10").split("-").map(Number);
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const run = {
    id: uid(),
    period: next,
    headcount: employees.length,
    gross: round(gross),
    net: round(gross * 0.78),
    status: "Draft",
  };
  state.payrollRuns.push(run);
  persist();
  return run;
}

// Performance
export const getReviews = () => state.reviews;
export function setReviewRating(id, rating) {
  const review = state.reviews.find((r) => r.id === id);
  if (review) {
    review.rating = rating;
    persist();
  }
}

// Compensation
export const getSalaryBands = () => state.salaryBands;

// Relations and compliance
export const getCases = () => state.cases;
export const getPolicies = () => state.policies;
export function setCaseStatus(id, status) {
  const item = state.cases.find((c) => c.id === id);
  if (item) {
    item.status = status;
    persist();
  }
}
export function acknowledgePolicy(id) {
  const policy = state.policies.find((p) => p.id === id);
  if (policy && policy.acknowledged < policy.total) {
    policy.acknowledged += 1;
    persist();
  }
}

// Administration
export const getUsers = () => state.users;
export function addUser(user) {
  state.users.push({ id: uid(), ...user });
  persist();
}
export function removeUser(id) {
  state.users = state.users.filter((u) => u.id !== id);
  persist();
}
export function setUserRole(id, role) {
  const user = state.users.find((u) => u.id === id);
  if (user) {
    user.role = role;
    persist();
  }
}

// Leave
export const getLeaveTypes = () => state.leaveTypes;
export const getLeaveRequests = () => state.leaveRequests;
export const getLeaveBalances = () => state.leaveBalances;
export const getBlackoutDates = () => state.blackoutDates ?? [];
export const getLeaveType = (id) => state.leaveTypes.find((t) => t.id === id) ?? null;

export function getBalance(employeeId, typeId) {
  return (
    state.leaveBalances.find((b) => b.employeeId === employeeId && b.typeId === typeId) ?? {
      employeeId,
      typeId,
      accrued: 0,
      used: 0,
    }
  );
}

export function addLeaveRequest(request) {
  const record = { id: uid(), submittedAt: new Date().toISOString().slice(0, 10), ...request };
  state.leaveRequests.unshift(record);
  persist();
  return record;
}

export function updateLeaveRequest(id, patch) {
  const request = state.leaveRequests.find((r) => r.id === id);
  if (request) {
    Object.assign(request, patch);
    persist();
  }
}

export function commitLeave(employeeId, typeId, days) {
  const balance = state.leaveBalances.find((b) => b.employeeId === employeeId && b.typeId === typeId);
  if (balance) balance.used += days;
  else state.leaveBalances.push({ employeeId, typeId, accrued: days, used: days });
  persist();
}
