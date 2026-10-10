import {
  getEmployees,
  getLeaveRequests,
  getLeaveType,
  getBalance,
  getBlackoutDates,
} from "../store.js";

const DAY = 86400000;
const ACTIVE = ["Approved", "Auto-approved", "Needs review", "Pending", "Evaluating"];

export function diffDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(1, Math.round((end - start) / DAY) + 1);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

function teamOverlap(request) {
  const employee = getEmployees().find((e) => e.id === request.employeeId);
  if (!employee) return [];
  return getLeaveRequests().filter((other) => {
    if (other.id === request.id || !ACTIVE.includes(other.status)) return false;
    const peer = getEmployees().find((e) => e.id === other.employeeId);
    if (!peer || peer.department !== employee.department) return false;
    return overlaps(request.startDate, request.endDate, other.startDate, other.endDate);
  });
}

export function evaluateRules(request) {
  const type = getLeaveType(request.typeId);
  const balance = getBalance(request.employeeId, request.typeId);
  const remaining = balance.accrued - balance.used;
  const days = request.days || diffDays(request.startDate, request.endDate);
  const results = [];

  results.push({
    id: "balance",
    label: "Balance",
    status: remaining >= days ? "pass" : "fail",
    detail: `${remaining} day(s) available, ${days} requested`,
  });

  const notice = type?.noticeDays ?? 0;
  if (notice > 0) {
    const given = Math.floor((new Date(request.startDate).getTime() - Date.now()) / DAY);
    results.push({
      id: "notice",
      label: "Notice period",
      status: given >= notice ? "pass" : "flag",
      detail: `${type?.name ?? "Leave"} prefers ${notice} day(s) notice, ${given} given`,
    });
  }

  if (type?.requiresDoc) {
    results.push({
      id: "document",
      label: "Supporting document",
      status: days > 2 ? "flag" : "pass",
      detail: days > 2 ? "Document required for absences over 2 days" : "Not required",
    });
  }

  const blackout = getBlackoutDates().find((b) =>
    overlaps(request.startDate, request.endDate, b.from, b.to),
  );
  if (blackout) {
    results.push({
      id: "blackout",
      label: "Blackout window",
      status: "flag",
      detail: `Overlaps ${blackout.label} (${blackout.from} to ${blackout.to})`,
    });
  }

  const coverage = teamOverlap(request);
  const max = type?.maxConcurrent ?? 2;
  results.push({
    id: "coverage",
    label: "Team coverage",
    status: coverage.length >= max ? "fail" : "pass",
    detail: `${coverage.length} teammate(s) already off, limit ${max}`,
  });

  return {
    results,
    days,
    remaining,
    hardFail: results.some((r) => r.status === "fail"),
    flags: results.filter((r) => r.status === "flag"),
  };
}
