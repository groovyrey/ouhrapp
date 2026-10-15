import {
  getEmployees,
  getDepartments,
  addEmployee,
  updateEmployee,
  removeEmployee,
} from "../store.js";
import { renderTable, viewHead, field, emptyState, panel } from "../components/index.js";
import { escapeHtml, formatDate } from "../utils/index.js";

const STATUSES = ["Active", "On leave", "Inactive"];
const COLUMNS = ["Name", "Email", "Department", "Title", "Status", "Started", ""];

export function employeesView(root) {
  let editingId = null;
  let query = "";

  root.innerHTML = `
    ${viewHead(
      "Employees",
      `<button class="btn btn--primary" type="button" data-action="new"><svg class="icon" aria-hidden="true"><use href="#icon-user-plus"></use></svg>Add employee</button>`,
    )}

    <form class="form" id="employee-form" hidden>
      ${field("First name", "firstName")}
      ${field("Last name", "lastName")}
      ${field("Email", "email", { type: "email" })}
      ${field("Title", "title")}
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
        <button class="btn btn--primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg>Save</button>
        <button class="btn" type="button" data-action="cancel"><svg class="icon" aria-hidden="true"><use href="#icon-x"></use></svg>Cancel</button>
      </div>
    </form>

    ${panel("Directory", `<div class="toolbar">
      <input class="input" id="employee-search" type="search" placeholder="Search employees" />
    </div>
    <div id="employee-table"></div>`)}
  `;

  const form = root.querySelector("#employee-form");
  const table = root.querySelector("#employee-table");

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
          <button class="btn btn--ghost" type="button" data-action="edit" data-id="${employee.id}"><svg class="icon" aria-hidden="true"><use href="#icon-edit"></use></svg>Edit</button>
          <button class="btn btn--ghost" type="button" data-action="delete" data-id="${employee.id}"><svg class="icon" aria-hidden="true"><use href="#icon-trash"></use></svg>Delete</button>
        </div>`,
      ]);

    table.innerHTML = rows.length
      ? renderTable({ columns: COLUMNS, rows })
      : emptyState("No employees match.");
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
