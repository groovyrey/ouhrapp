import { getCandidates, addCandidate, moveCandidate, STAGES } from "../store.js";
import { viewHead, field } from "../components/index.js";
import { escapeHtml } from "../utils/index.js";

export function recruitmentView(root) {
  function paint() {
    const candidates = getCandidates();
    root.querySelector("#kanban").innerHTML = STAGES.map((stage) => {
      const cards = candidates
        .filter((candidate) => candidate.stage === stage)
        .map(
          (candidate) => `
          <div class="kanban__card">
            <strong>${escapeHtml(candidate.name)}</strong>
            <span class="muted">${escapeHtml(candidate.role)}</span>
            <div class="actions">
              <button class="btn btn--ghost" type="button" data-move="-1" data-id="${candidate.id}"><svg class="icon" aria-hidden="true"><use href="#icon-chevron-left"></use></svg>Back</button>
              <button class="btn btn--ghost" type="button" data-move="1" data-id="${candidate.id}">Advance<svg class="icon" aria-hidden="true"><use href="#icon-chevron-right"></use></svg></button>
            </div>
          </div>`,
        )
        .join("");
      return `<div class="kanban__col">
        <h2 class="kanban__title">${stage} <span class="num">${candidates.filter((c) => c.stage === stage).length}</span></h2>
        ${cards}
      </div>`;
    }).join("");
  }

  root.innerHTML = `
    ${viewHead("Recruitment")}
    <form class="form form--inline" id="candidate-form">
      ${field("Name", "name")}
      ${field("Role", "role")}
      <div class="form__actions">
        <button class="btn btn--primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#icon-user-plus"></use></svg>Add candidate</button>
      </div>
    </form>
    <div class="kanban" id="kanban"></div>
  `;

  root.querySelector("#candidate-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    addCandidate({ name: data.name, role: data.role, stage: STAGES[0] });
    event.target.reset();
    paint();
  });

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-move]");
    if (!button) return;
    moveCandidate(button.dataset.id, Number(button.dataset.move));
    paint();
  });

  paint();
}
