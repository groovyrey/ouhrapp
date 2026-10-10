import { getOnboardings, toggleTask } from "../store.js";
import { viewHead } from "../components/index.js";
import { escapeHtml, formatDate } from "../utils/index.js";

export function onboardingView(root) {
  function paint() {
    root.querySelector("#onboarding-list").innerHTML = getOnboardings()
      .map((onboarding) => {
        const done = onboarding.tasks.filter((task) => task.done).length;
        const total = onboarding.tasks.length;
        const percent = Math.round((done / total) * 100);
        const tasks = onboarding.tasks
          .map(
            (task) => `
            <label class="check">
              <input type="checkbox" data-onboarding="${onboarding.id}" data-task="${task.id}" ${task.done ? "checked" : ""} />
              <span>${escapeHtml(task.label)}</span>
            </label>`,
          )
          .join("");
        return `
        <article class="card">
          <header class="card__head">
            <div>
              <strong>${escapeHtml(onboarding.name)}</strong>
              <span class="muted">${escapeHtml(onboarding.role)}</span>
            </div>
            <span class="num muted">${formatDate(onboarding.startDate)}</span>
          </header>
          <div class="progress"><div class="progress__bar" style="width:${percent}%"></div></div>
          <p class="muted">${done} of ${total} tasks done</p>
          <div class="checks">${tasks}</div>
        </article>`;
      })
      .join("");
  }

  root.innerHTML = `${viewHead("Onboarding")}<div class="cards" id="onboarding-list"></div>`;

  root.addEventListener("change", (event) => {
    const box = event.target.closest("input[data-task]");
    if (!box) return;
    toggleTask(box.dataset.onboarding, box.dataset.task);
    paint();
  });

  paint();
}
