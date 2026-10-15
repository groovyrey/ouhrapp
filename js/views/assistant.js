import { viewHead } from "../components/index.js";
import { escapeHtml } from "../utils/index.js";
import { getMessages, sendMessage, clearMessages } from "../services/index.js";

const SUGGESTIONS = [
  "How is headcount tracking against plan?",
  "Which leave requests need my attention?",
  "Summarize the hiring pipeline.",
  "Which policies need reminders?",
  "Any attendance or overtime concerns?",
  "Where are we understaffed?",
];

const EMPTY =
  "Ask about people, hiring, onboarding, leave, attendance, payroll, performance, compensation, compliance, or reports. The assistant sees only non-private data and advises; you decide.";

function bubble(message) {
  const isUser = message.role === "user";
  const meta = isUser
    ? ""
    : `<span class="chat__meta">${escapeHtml(
        message.source === "ai" ? message.model || "assistant" : "offline snapshot",
      )}</span>`;
  return `<div class="chat__row ${isUser ? "chat__row--user" : "chat__row--bot"}">
    <div class="chat__bubble">${escapeHtml(message.text)}</div>
    ${meta}
  </div>`;
}

export function assistantView(root) {
  let pending = false;

  root.innerHTML = `
    ${viewHead("Manager assistant", `<button class="btn btn--ghost" type="button" id="assistant-reset">Clear</button>`)}
    <section class="chat">
      <div class="chat__log" id="assistant-log" aria-live="polite"></div>
      <div class="chat__suggestions" id="assistant-suggestions">
        ${SUGGESTIONS.map(
          (text) => `<button class="btn btn--ghost chat__suggestion" type="button" data-suggestion="${escapeHtml(text)}">${escapeHtml(text)}</button>`,
        ).join("")}
      </div>
      <form class="chat__form" id="assistant-form">
        <input class="input" id="assistant-input" type="text" autocomplete="off" placeholder="Ask the assistant..." aria-label="Message the assistant" />
        <button class="btn btn--primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#icon-send"></use></svg>Send</button>
      </form>
    </section>
  `;

  const log = root.querySelector("#assistant-log");
  const form = root.querySelector("#assistant-form");
  const input = root.querySelector("#assistant-input");
  const send = form.querySelector("button[type=submit]");
  const suggestions = root.querySelector("#assistant-suggestions");

  function paint() {
    const messages = getMessages();
    const body = messages.map(bubble).join("");
    const thinking = pending
      ? `<div class="chat__row chat__row--bot"><div class="chat__bubble chat__bubble--muted">Thinking...</div></div>`
      : "";
    log.innerHTML = messages.length || pending ? body + thinking : `<p class="muted">${EMPTY}</p>`;
    log.scrollTop = log.scrollHeight;
    input.disabled = pending;
    send.disabled = pending;
  }

  async function ask(text) {
    const value = String(text ?? "").trim();
    if (!value || pending) return;
    pending = true;
    const promise = sendMessage(value);
    paint();
    await promise;
    pending = false;
    paint();
    input.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
    input.value = "";
  });

  suggestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-suggestion]");
    if (button) ask(button.dataset.suggestion);
  });

  root.querySelector("#assistant-reset").addEventListener("click", () => {
    clearMessages();
    paint();
  });

  paint();
}
