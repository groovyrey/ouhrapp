import {
  getEmployees,
  getLeaveTypes,
  getLeaveRequests,
  getLeaveType,
  getBalance,
  addLeaveRequest,
  updateLeaveRequest,
  commitLeave,
} from "../store.js";
import { viewHead, field } from "../components/index.js";
import { escapeHtml, formatDate } from "../utils/index.js";
import { evaluateRules, requestEvaluation, decide, diffDays } from "../services/index.js";

const MANAGER = "Mara Ibarra";
const WAIT = ["Needs review", "Pending", "Evaluating"];

function capitalize(value) {
  return String(value ?? "").charAt(0).toUpperCase() + String(value ?? "").slice(1);
}

function statusClass(status) {
  if (status === "Rejected") return "is-bad";
  if (WAIT.includes(status)) return "is-wait";
  return "is-good";
}

function ruleRow(rule) {
  return `<div class="kv">
    <span class="muted">${escapeHtml(rule.label)}</span>
    <span class="rule-${rule.status}">${capitalize(rule.status)}, ${escapeHtml(rule.detail)}</span>
  </div>`;
}

function requestCard(request) {
  const type = getLeaveType(request.typeId);
  const decision = request.decision ?? {};
  const ai = decision.ai ?? null;
  const balance = getBalance(request.employeeId, request.typeId);
  const rules = (decision.rules ?? []).map(ruleRow).join("");

  const aiBlock = ai
    ? `
      <div class="kv">
        <span class="muted">AI recommendation</span>
        <span>${capitalize(ai.decision)} (${Math.round((ai.confidence ?? 0) * 100)}%)</span>
      </div>
      <p class="muted">${escapeHtml(ai.rationale || "")}</p>
      ${ai.flags && ai.flags.length ? `<p class="muted">Flags: ${escapeHtml(ai.flags.join("; "))}</p>` : ""}
      <p class="muted">Source: ${escapeHtml(ai.source === "ai" ? ai.model || "Gemini" : "rules only")}</p>`
    : `<p class="muted">Evaluating...</p>`;

  const override = WAIT.includes(request.status)
    ? `<div class="actions">
        <button class="btn btn--accent" type="button" data-decide="approve" data-id="${request.id}"><svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg>Approve</button>
        <button class="btn btn--ghost" type="button" data-decide="reject" data-id="${request.id}"><svg class="icon" aria-hidden="true"><use href="#icon-x"></use></svg>Reject</button>
      </div>`
    : "";

  return `
    <article class="card">
      <header class="card__head">
        <div>
          <strong>${escapeHtml(request.employeeName)}</strong>
          <span class="muted">${escapeHtml(type?.name ?? request.typeId)} - ${formatDate(request.startDate)} to ${formatDate(request.endDate)}</span>
        </div>
        <span class="leave-status ${statusClass(request.status)}">${escapeHtml(request.status)}</span>
      </header>
      <div class="kv"><span class="muted">Days</span><span class="num">${request.days}</span></div>
      <div class="kv"><span class="muted">Reason</span><span>${escapeHtml(request.reason || "not provided")}</span></div>
      <div class="kv"><span class="muted">Balance left</span><span class="num">${balance.accrued - balance.used} day(s)</span></div>
      ${rules}
      ${aiBlock}
      <div class="kv"><span class="muted">Decided by</span><span>${escapeHtml(decision.decidedBy || "-")}</span></div>
      ${override}
    </article>`;
}

export function leaveView(root) {
  const employees = getEmployees();
  const types = getLeaveTypes();

  async function evaluate(request) {
    const evaluation = evaluateRules(request);
    updateLeaveRequest(request.id, {
      decision: { final: "Evaluating", decidedBy: "Pending human", rules: evaluation.results, ai: null },
    });
    paint();

    const ai = await requestEvaluation(request, getLeaveType(request.typeId), evaluation);
    const decision = decide(evaluation, ai);
    updateLeaveRequest(request.id, { status: decision.final, decision });
    if (decision.final === "Auto-approved") {
      commitLeave(request.employeeId, request.typeId, request.days);
    }
    paint();
  }

  function paint() {
    const list = getLeaveRequests();
    root.querySelector("#leave-list").innerHTML = list.length
      ? list.map(requestCard).join("")
      : `<p class="muted">No leave requests yet.</p>`;
  }

  root.innerHTML = `
    ${viewHead("Leave automation")}
    <form class="form form--inline" id="leave-form">
      <label class="field">Employee
        <select class="select" name="employeeId">${employees
          .map((e) => `<option value="${e.id}">${escapeHtml(e.firstName)} ${escapeHtml(e.lastName)}</option>`)
          .join("")}</select>
      </label>
      <label class="field">Leave type
        <select class="select" name="typeId">${types
          .map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
          .join("")}</select>
      </label>
      ${field("Start", "startDate", { type: "date" })}
      ${field("End", "endDate", { type: "date" })}
      ${field("Reason", "reason", { required: false })}
      <div class="form__actions">
        <button class="btn btn--primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#icon-send"></use></svg>Submit for evaluation</button>
      </div>
    </form>
    <div class="cards" id="leave-list"></div>
  `;

  root.querySelector("#leave-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    const employee = employees.find((e) => e.id === data.employeeId);
    if (!employee || !data.startDate || !data.endDate) return;
    const request = addLeaveRequest({
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      typeId: data.typeId,
      startDate: data.startDate,
      endDate: data.endDate,
      days: diffDays(data.startDate, data.endDate),
      reason: data.reason || "",
      status: "Evaluating",
    });
    event.target.reset();
    paint();
    evaluate(request);
  });

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-decide]");
    if (!button) return;
    const request = getLeaveRequests().find((r) => r.id === button.dataset.id);
    if (!request) return;
    const final = button.dataset.decide === "approve" ? "Approved" : "Rejected";
    updateLeaveRequest(request.id, {
      status: final,
      decision: { ...request.decision, final, decidedBy: MANAGER, decidedAt: new Date().toISOString() },
    });
    if (final === "Approved") commitLeave(request.employeeId, request.typeId, request.days);
    paint();
  });

  paint();
}
