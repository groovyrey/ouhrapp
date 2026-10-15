import { getCases, setCaseStatus, getPolicies, acknowledgePolicy } from "../store.js";
import { renderTable, viewHead, panel } from "../components/index.js";
import { escapeHtml, formatDate } from "../utils/index.js";

const STATUSES = ["Open", "Investigating", "Resolved"];

export function relationsView(root) {
  function paint() {
    const caseRows = getCases().map((item) => [
      escapeHtml(item.subject),
      escapeHtml(item.employee),
      escapeHtml(item.type),
      `<span class="num">${escapeHtml(formatDate(item.opened))}</span>`,
      `<select class="select select--mini" data-case="${item.id}">
        ${STATUSES.map((s) => `<option ${s === item.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>`,
    ]);

    const policyRows = getPolicies().map((policy) => [
      escapeHtml(policy.name),
      `<span class="num">${policy.acknowledged} / ${policy.total}</span>`,
      policy.acknowledged >= policy.total
        ? "Complete"
        : `<button class="btn btn--ghost" type="button" data-ack="${policy.id}"><svg class="icon" aria-hidden="true"><use href="#icon-ack"></use></svg>Record acknowledgment</button>`,
    ]);

    root.querySelector("#cases-table").innerHTML = renderTable({
      columns: ["Subject", "Employee", "Type", "Opened", "Status"],
      rows: caseRows,
    });
    root.querySelector("#policies-table").innerHTML = renderTable({
      columns: ["Policy", "Acknowledged", ""],
      rows: policyRows,
    });
  }

  root.innerHTML = `
    ${viewHead("Relations and compliance")}
    ${panel("Cases", `<div id="cases-table"></div>`)}
    ${panel("Policies", `<div id="policies-table"></div>`)}
  `;

  root.addEventListener("change", (event) => {
    if (!event.target.dataset.case) return;
    setCaseStatus(event.target.dataset.case, event.target.value);
    paint();
  });

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ack]");
    if (!button) return;
    acknowledgePolicy(button.dataset.ack);
    paint();
  });

  paint();
}
