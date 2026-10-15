import { getPlans, updatePlan, getEmployees } from "../store.js";
import { renderTable, viewHead, panel } from "../components/index.js";
import { escapeHtml } from "../utils/index.js";

export function workforceView(root) {
  function paint() {
    const employees = getEmployees();
    const rows = getPlans().map((plan) => {
      const actual = employees.filter((e) => e.department === plan.department).length;
      const gap = plan.planned - actual;
      return [
        escapeHtml(plan.department),
        `<span class="num">${plan.planned}</span>`,
        `<span class="num">${actual}</span>`,
        `<span class="num ${gap < 0 ? "over" : ""}">${gap > 0 ? `+${gap}` : gap}</span>`,
        `<input class="input input--mini" type="number" min="0" value="${plan.planned}" data-plan="${plan.id}" />`,
      ];
    });
    root.querySelector("#workforce-table").innerHTML = renderTable({
      columns: ["Department", "Planned", "Actual", "Gap", "Set planned"],
      rows,
    });
  }

  root.innerHTML = `${viewHead("Workforce planning")}${panel("Workforce plan", `<div id="workforce-table"></div>`)}`;

  root.addEventListener("change", (event) => {
    const id = event.target.dataset.plan;
    if (!id) return;
    updatePlan(id, Math.max(0, Number(event.target.value) || 0));
    paint();
  });

  paint();
}
