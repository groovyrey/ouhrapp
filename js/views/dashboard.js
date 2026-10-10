import { getEmployees, getDepartments } from "../store.js";
import { renderTable } from "../components/index.js";

export function dashboardView(root) {
  const employees = getEmployees();
  const active = employees.filter((e) => e.status === "Active").length;

  const headcount = getDepartments().map((department) => [
    department,
    `<span class="num">${employees.filter((e) => e.department === department).length}</span>`,
  ]);

  root.innerHTML = `
    <header class="view-head"><h1>Dashboard</h1></header>
    <p class="muted">${employees.length} employees, ${active} active.</p>
    ${renderTable({ columns: ["Department", "Headcount"], rows: headcount })}
  `;
}
