import { getEmployees, getDepartments } from "../store.js";
import { renderTable, viewHead, panel } from "../components/index.js";

export function dashboardView(root) {
  const employees = getEmployees();
  const active = employees.filter((e) => e.status === "Active").length;

  const headcount = getDepartments().map((department) => [
    department,
    `<span class="num">${employees.filter((e) => e.department === department).length}</span>`,
  ]);

  root.innerHTML = `
    ${viewHead("Dashboard")}
    ${panel("Headcount by department", renderTable({ columns: ["Department", "Headcount"], rows: headcount }), {
      meta: `${employees.length} employees, ${active} active`,
    })}
  `;
}
