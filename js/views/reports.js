import { getEmployees, getDepartments } from "../store.js";
import { renderBars, renderTable, viewHead, panel } from "../components/index.js";
import { escapeHtml, formatMoney } from "../utils/index.js";

export function reportsView(root) {
  const employees = getEmployees();

  const byDepartment = getDepartments().map((department) => [
    department,
    employees.filter((e) => e.department === department).length,
  ]);

  const statuses = [...new Set(employees.map((e) => e.status))];
  const byStatus = statuses.map((status) => [
    status,
    employees.filter((e) => e.status === status).length,
  ]);

  const salaryRows = getDepartments().map((department) => {
    const list = employees.filter((e) => e.department === department);
    const average = list.length
      ? Math.round(list.reduce((sum, e) => sum + (e.salary ?? 0), 0) / list.length)
      : 0;
    return [escapeHtml(department), `<span class="num">${formatMoney(average)}</span>`];
  });

  root.innerHTML = `
    ${viewHead("Reports")}
    ${panel("Headcount by department", renderBars(byDepartment))}
    ${panel("Headcount by status", renderBars(byStatus))}
    ${panel(
      "Average salary by department",
      renderTable({ columns: ["Department", "Average salary"], rows: salaryRows }),
    )}
  `;
}
