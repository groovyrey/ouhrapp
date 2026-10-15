import { getSalaryBands, getEmployees } from "../store.js";
import { renderTable, viewHead, panel } from "../components/index.js";
import { escapeHtml, formatMoney } from "../utils/index.js";

export function compensationView(root) {
  const bands = getSalaryBands().map((band) => [
    escapeHtml(band.department),
    escapeHtml(band.level),
    `<span class="num">${formatMoney(band.min)}</span>`,
    `<span class="num">${formatMoney(Math.round((band.min + band.max) / 2))}</span>`,
    `<span class="num">${formatMoney(band.max)}</span>`,
  ]);

  const salaries = getEmployees().map((employee) => [
    escapeHtml(`${employee.firstName} ${employee.lastName}`),
    escapeHtml(employee.department),
    escapeHtml(employee.title),
    `<span class="num">${formatMoney(employee.salary)}</span>`,
  ]);

  root.innerHTML = `
    ${viewHead("Compensation")}
    ${panel("Salary bands", renderTable({ columns: ["Department", "Level", "Min", "Mid", "Max"], rows: bands }))}
    ${panel("Current salaries", renderTable({ columns: ["Employee", "Department", "Title", "Salary"], rows: salaries }))}
  `;
}
