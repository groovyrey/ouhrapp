import { getUsers, addUser, removeUser, setUserRole, resetData } from "../store.js";
import { renderTable, viewHead, field, panel } from "../components/index.js";
import { escapeHtml } from "../utils/index.js";

const ROLES = ["Administrator", "HR", "Payroll officer", "Manager", "Employee"];

export function adminView(root) {
  function paint() {
    const rows = getUsers().map((user) => [
      escapeHtml(user.name),
      escapeHtml(user.email),
      `<select class="select select--mini" data-user="${user.id}">
        ${ROLES.map((role) => `<option ${role === user.role ? "selected" : ""}>${role}</option>`).join("")}
      </select>`,
      `<button class="btn btn--ghost" type="button" data-remove="${user.id}"><svg class="icon" aria-hidden="true"><use href="#icon-trash"></use></svg>Remove</button>`,
    ]);
    root.querySelector("#users-table").innerHTML = renderTable({
      columns: ["Name", "Email", "Role", ""],
      rows,
    });
  }

  root.innerHTML = `
    ${viewHead("Administration", `<button class="btn" id="reset" type="button"><svg class="icon" aria-hidden="true"><use href="#icon-reset"></use></svg>Reset demo data</button>`)}
    <form class="form form--inline" id="user-form">
      ${field("Name", "name")}
      ${field("Email", "email", { type: "email" })}
      ${field("Role", "role", { options: ROLES })}
      <div class="form__actions">
        <button class="btn btn--primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#icon-user-plus"></use></svg>Add user</button>
      </div>
    </form>
    ${panel("Users", `<div id="users-table"></div>`)}
  `;

  root.querySelector("#user-form").addEventListener("submit", (event) => {
    event.preventDefault();
    addUser(Object.fromEntries(new FormData(event.target).entries()));
    event.target.reset();
    paint();
  });

  root.addEventListener("change", (event) => {
    if (!event.target.dataset.user) return;
    setUserRole(event.target.dataset.user, event.target.value);
    paint();
  });

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (button) {
      removeUser(button.dataset.remove);
      paint();
      return;
    }
    if (event.target.closest("#reset") && confirm("Reset all demo data?")) {
      resetData();
      paint();
    }
  });

  paint();
}
