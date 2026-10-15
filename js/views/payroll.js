import { getPayrollRuns, runPayroll } from "../store.js";
import { renderTable, viewHead, panel } from "../components/index.js";
import { escapeHtml, formatMoney } from "../utils/index.js";

export function payrollView(root) {
  function paint() {
    const runs = getPayrollRuns();
    const rows = runs.map((run) => [
      `<span class="num">${escapeHtml(run.period)}</span>`,
      `<span class="num">${run.headcount}</span>`,
      `<span class="num">${formatMoney(run.gross)}</span>`,
      `<span class="num">${formatMoney(run.net)}</span>`,
      escapeHtml(run.status),
    ]);
    root.querySelector("#payroll-table").innerHTML = renderTable({
      columns: ["Period", "Headcount", "Gross", "Net", "Status"],
      rows,
    });
  }

  root.innerHTML = `
    ${viewHead("Payroll", `<button class="btn btn--primary" id="run-payroll" type="button"><svg class="icon" aria-hidden="true"><use href="#icon-play"></use></svg>Run payroll</button>`)}
    ${panel("Payroll runs", `<div id="payroll-table"></div>`, {
      meta: "Computed from active salaries. Real disbursement stays with a payroll provider.",
    })}
  `;

  root.querySelector("#run-payroll").addEventListener("click", () => {
    const run = runPayroll();
    paint();
    root.querySelector("#payroll-table").insertAdjacentHTML(
      "beforebegin",
      `<p class="muted">Created draft run for ${run.period}: ${formatMoney(run.gross)} gross.</p>`,
    );
  });

  paint();
}
