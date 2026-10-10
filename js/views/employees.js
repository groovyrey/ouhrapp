import {
  getEmployees,
  getDepartments,
  addEmployee,
  updateEmployee,
  removeEmployee,
} from "../store.js";
import { renderTable } from "../components/index.js";
import { escapeHtml, formatDate } from "../utils/index.js";

const STATUSES = ["Active", "On leave", "Inactive"];
const COLUMNS = ["Name", "Email", "Department", "Title", "Status", "Started", ""];

export function employeesView(root) {
  let editingId = null;
  let query = "";

  root.innerHTML = `
    <header class="view-head">
      <h1>Employees</h1>
      <button class="btn btn--primary" type="button" data-action="new">Add employee</button>
    </header>

    <form class="form" id="employee-form" hidden>
      ${field("firstName", "First name", "text")}
      ${field("lastName", "Last name", "text")}
      ${field("email", "Email", "email")}
      ${field("title", "Title", "text")}
      <label class="field">Department
        <select class="select" name="department">
          ${getDepartments().map((d) => `<option>${d}</option>`).join("")}
        </select>
      </label>
      <label class="field">Status
        <select class="select" name="status">
          ${STATUSES.map((s) => `<option>${s}</option>`).join("")}
        </select>
      </label>
      <label class="field">Start date
        <input class="input" type="date" name="startDate" />
      </label>
      <div class="form__actions">
        <button class="btn btn--primary" type="submit">Save</button>
        <button class="btn" type="button" data-action="cancel">Cancel</button>
      </div>
    </form>

    <div class="toolbar">
      <input class="input" id="employee-search" type="search" placeholder="Search employees" />
    </div>

    <div id="employee-table"></div>
  `;

  const form = root.querySelector("#employee-form");
  const table = root.querySelector("#employee-table");

  function field(name, label, type) {
    return `<label class="field">${label}
      <input class="input" type="${type}" name="${name}" required />
    </label>`;
  }

  function paint() {
    const needle = query.trim().toLowerCase();
    const rows = getEmployees()
      .filter((employee) =>
        [employee.firstName, employee.lastName, employee.email, employee.department]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .map((employee) => [
        escapeHtml(`${employee.firstName} ${employee.lastName}`),
        escapeHtml(employee.email),
        escapeHtml(employee.department),
        escapeHtml(employee.title),
        escapeHtml(employee.status),
        `<span class="num">${escapeHtml(formatDate(employee.startDate))}</span>`,
        `<div class="actions">
          <button class="btn btn--ghost" type="button" data-action="edit" data-id="${employee.id}">Edit</button>
          <button class="btn btn--ghost" type="button" data-action="delete" data-id="${employee.id}">Delete</button>
        </div>`,
      ]);

    table.innerHTML = rows.length
      ? renderTable({ columns: COLUMNS, rows })
      : `<p class="muted">No employees match.</p>`;
  }

  function openForm(id = null) {
    editingId = id;
    form.reset();
    if (id) {
      const employee = getEmployees().find((item) => item.id === id);
      if (employee) {
        ["firstName", "lastName", "email", "title", "department", "status", "startDate"].forEach(
          (key) => {
            form.elements[key].value = employee[key] ?? "";
          },
        );
      }
    }
    form.hidden = false;
    form.elements.firstName.focus();
  }

  function closeForm() {
    editingId = null;
    form.hidden = true;
    form.reset();
  }

  root.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    const { action, id } = trigger.dataset;

    if (action === "new") openForm();
    if (action === "cancel") closeForm();
    if (action === "edit") openForm(id);
    if (action === "delete") {
      const employee = getEmployees().find((item) => item.id === id);
      if (employee && confirm(`Delete ${employee.firstName} ${employee.lastName}?`)) {
        removeEmployee(id);
        paint();
      }
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (editingId) updateEmployee(editingId, data);
    else addEmployee({ id: crypto.randomUUID(), ...data });
    closeForm();
    paint();
  });

  root.querySelector("#employee-search").addEventListener("input", (event) => {
    query = event.target.value;
    paint();
  });

  paint();
}
