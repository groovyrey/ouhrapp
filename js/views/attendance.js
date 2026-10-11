import { getTimeEntries, addTimeEntry } from "../store.js";
import { renderTable, viewHead, field } from "../components/index.js";
import { escapeHtml, formatDate } from "../utils/index.js";

const EMPLOYEE = "Rey Centeno";

export function attendanceView(root) {
  let sessionStart = null;

  function paint() {
    const entries = getTimeEntries();
    const total = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const rows = entries.map((entry) => [
      escapeHtml(entry.employee),
      `<span class="num">${escapeHtml(formatDate(entry.date))}</span>`,
      `<span class="num">${entry.hours}</span>`,
      escapeHtml(entry.note || ""),
    ]);
    root.querySelector("#time-table").innerHTML =
      `<p class="muted">${entries.length} entries, <span class="num">${total}</span> hours logged.</p>` +
      renderTable({ columns: ["Employee", "Date", "Hours", "Note"], rows });
  }

  root.innerHTML = `
    ${viewHead("Time and attendance", `<button class="btn btn--primary" id="clock" type="button"><svg class="icon" aria-hidden="true"><use href="#icon-clock"></use></svg><span id="clock-label">Clock in</span></button>`)}
    <p class="muted" id="clock-status">Not clocked in.</p>
    <form class="form form--inline" id="time-form">
      ${field("Employee", "employee")}
      ${field("Date", "date", { type: "date" })}
      ${field("Hours", "hours", { type: "number" })}
      ${field("Note", "note", { required: false })}
      <div class="form__actions">
        <button class="btn btn--primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#icon-clock"></use></svg>Log time</button>
      </div>
    </form>
    <div id="time-table"></div>
  `;

  const clockButton = root.querySelector("#clock");
  const clockLabel = root.querySelector("#clock-label");
  const status = root.querySelector("#clock-status");

  clockButton.addEventListener("click", () => {
    if (!sessionStart) {
      sessionStart = Date.now();
      clockLabel.textContent = "Clock out";
      status.textContent = `Clocked in at ${new Date(sessionStart).toLocaleTimeString()}.`;
      return;
    }
    const hours = Math.max(0.1, Math.round(((Date.now() - sessionStart) / 3600000) * 10) / 10);
    addTimeEntry({ employee: EMPLOYEE, date: new Date().toISOString().slice(0, 10), hours, note: "Clocked" });
    sessionStart = null;
    clockLabel.textContent = "Clock in";
    status.textContent = "Not clocked in.";
    paint();
  });

  root.querySelector("#time-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    addTimeEntry({
      employee: data.employee,
      date: data.date,
      hours: Number(data.hours) || 0,
      note: data.note,
    });
    event.target.reset();
    paint();
  });

  paint();
}
