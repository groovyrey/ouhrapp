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
import { viewHead, field, card, cardHead, kv, emptyState, cards } from "../components/index.js";
import { escapeHtml, formatDate, diffDays } from "../utils/index.js";

const MANAGER = "Mara Ibarra";
const WAITING = "Needs review";

function statusClass(status) {
  if (status === "Rejected") return "is-bad";
  if (status === WAITING) return "is-wait";
  return "is-good";
}

function requestCard(request) {
  const type = getLeaveType(request.typeId);
  const decision = request.decision ?? {};
  const balance = getBalance(request.employeeId, request.typeId);

  const actions =
    request.status === WAITING
      ? `<div class="actions">
          <button class="btn btn--accent" type="button" data-decide="approve" data-id="${request.id}"><svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg>Approve</button>
          <button class="btn btn--ghost" type="button" data-decide="reject" data-id="${request.id}"><svg class="icon" aria-hidden="true"><use href="#icon-x"></use></svg>Reject</button>
        </div>`
      : "";

  const head = cardHead(escapeHtml(request.employeeName), {
    meta: `${escapeHtml(type?.name ?? request.typeId)} - ${formatDate(request.startDate)} to ${formatDate(request.endDate)}`,
    action: `<span class="leave-status ${statusClass(request.status)}">${escapeHtml(request.status)}</span>`,
  });

  return card(
    `${head}
      ${kv("Days", `<span class="num">${request.days}</span>`)}
      ${kv("Reason", escapeHtml(request.reason || "not provided"))}
      ${kv("Balance left", `<span class="num">${balance.accrued - balance.used} day(s)</span>`)}
      ${kv("Decided by", escapeHtml(decision.decidedBy || "-"))}
      ${actions}`,
  );
}

export function leaveView(root) {
  const employees = getEmployees();
  const types = getLeaveTypes();

  function paint() {
    const list = getLeaveRequests();
    root.querySelector("#leave-list").innerHTML = list.length
      ? list.map(requestCard).join("")
      : emptyState("No leave requests yet.");
  }

  root.innerHTML = `
    ${viewHead("Leave", `<a class="btn btn--ghost" href="#/assistant">Ask the assistant</a>`)}
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
        <button class="btn btn--primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#icon-send"></use></svg>File request</button>
      </div>
    </form>
    ${cards("leave-list")}
  `;

  root.querySelector("#leave-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    const employee = employees.find((e) => e.id === data.employeeId);
    if (!employee || !data.startDate || !data.endDate) return;
    addLeaveRequest({
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      typeId: data.typeId,
      startDate: data.startDate,
      endDate: data.endDate,
      days: diffDays(data.startDate, data.endDate),
      reason: data.reason || "",
      status: WAITING,
      decision: { final: WAITING, decidedBy: "Awaiting manager", decidedAt: null },
    });
    event.target.reset();
    paint();
  });

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-decide]");
    if (!button) return;
    const request = getLeaveRequests().find((r) => r.id === button.dataset.id);
    if (!request || request.status !== WAITING) return;
    const final = button.dataset.decide === "approve" ? "Approved" : "Rejected";
    updateLeaveRequest(request.id, {
      status: final,
      decision: { final, decidedBy: MANAGER, decidedAt: new Date().toISOString() },
    });
    if (final === "Approved") commitLeave(request.employeeId, request.typeId, request.days);
    paint();
  });

  paint();
}
