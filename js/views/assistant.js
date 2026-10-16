import { escapeHtml, renderMarkdown } from "../utils/index.js";
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
  "Ask about people, hiring, onboarding, leave, attendance, payroll, performance, compensation, compliance, or reports.";

function step(message) {
  const done = message.status === "done";
  const state = done
    ? `<svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg>`
    : `<span class="chat__spinner" aria-hidden="true"></span>`;
  return `<div class="msg msg--system"><div class="chat__step">${state}<span>${escapeHtml(message.text)}</span></div></div>`;
}

function row(message) {
  if (message.role === "system") return step(message);

  if (message.role === "user") {
    return `<div class="msg msg--user"><div class="msg__bubble">${escapeHtml(message.text)}</div></div>`;
  }

  const failed = message.source !== "ai";
  const notice = failed
    ? `<span class="chat__error">Assistant unavailable: ${escapeHtml(message.error || "the request failed")}. Showing a local snapshot.</span>`
    : "";
  return `<div class="msg msg--bot"><div class="msg__text">${notice}${renderMarkdown(message.text)}</div></div>`;
}

export function assistantView(root) {
  let pending = false;
  let streaming = "";

  root.innerHTML = `
    <section class="chat">
      <header class="chat__header">
        <div class="chat__title">
          <strong>Manager assistant</strong>
          <span class="muted">Reads live HR data to support decisions</span>
        </div>
        <button class="btn btn--ghost" type="button" id="assistant-reset">Clear</button>
      </header>

      <div class="chat__log" id="assistant-log" aria-live="polite"></div>

      <footer class="chat__composer">
        <div class="chat__suggestions" id="assistant-suggestions">
          ${SUGGESTIONS.map(
            (text) => `<button class="btn btn--ghost chat__suggestion" type="button" data-suggestion="${escapeHtml(text)}">${escapeHtml(text)}</button>`,
          ).join("")}
        </div>
        <form class="chat__form" id="assistant-form">
          <input class="input chat__input" id="assistant-input" type="text" autocomplete="off" placeholder="Message the assistant" aria-label="Message the assistant" />
          <button class="btn btn--accent chat__send" type="submit">
            <svg class="icon" aria-hidden="true"><use href="#icon-send"></use></svg>
            <span>Send</span>
          </button>
        </form>
      </footer>
    </section>
  `;

  const log = root.querySelector("#assistant-log");
  const form = root.querySelector("#assistant-form");
  const input = root.querySelector("#assistant-input");
  const send = form.querySelector("button[type=submit]");
  const suggestions = root.querySelector("#assistant-suggestions");

  function paint() {
    const messages = getMessages();
    const body = messages.map(row).join("");
    const stream = streaming
      ? `<div class="msg msg--bot msg--streaming"><div class="msg__text chat__bubble--streaming">${renderMarkdown(streaming)}</div></div>`
      : "";
    log.innerHTML = messages.length || pending ? body + stream : `<div class="msg__empty muted">${EMPTY}</div>`;
    log.scrollTop = log.scrollHeight;
    input.disabled = pending;
    send.disabled = pending;
  }

  async function ask(text) {
    const value = String(text ?? "").trim();
    if (!value || pending) return;
    pending = true;
    streaming = "";
    const promise = sendMessage(value, {
      onToken: (partial) => {
        streaming = partial;
        paint();
      },
    });
    paint();
    await promise;
    pending = false;
    streaming = "";
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
