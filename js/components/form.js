import { escapeHtml } from "../utils/index.js";

export function viewHead(title, action = "") {
  return `<header class="view-head"><h1>${title}</h1>${action}</header>`;
}

export function field(label, name, { type = "text", options = null, required = true, placeholder = "" } = {}) {
  const req = required ? " required" : "";
  const ph = placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : "";
  if (options) {
    return `<label class="field">${label}
      <select class="select" name="${name}">${options
        .map((option) => `<option>${option}</option>`)
        .join("")}</select>
    </label>`;
  }
  return `<label class="field">${label}
    <input class="input" type="${type}" name="${name}"${req}${ph} />
  </label>`;
}
