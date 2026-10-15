export function card(content, { className = "", id = "" } = {}) {
  const classes = className ? `card ${className}` : "card";
  const attr = id ? ` id="${id}"` : "";
  return `<article class="${classes}"${attr}>${content}</article>`;
}

export function cardHead(title, { meta = "", action = "" } = {}) {
  return `<header class="card__head">
    <div>
      <strong>${title}</strong>
      ${meta ? `<span class="muted">${meta}</span>` : ""}
    </div>
    ${action}
  </header>`;
}

export function panel(title, body, { meta = "", action = "" } = {}) {
  const head = title ? cardHead(title, { meta, action }) : "";
  return card(`${head}<div class="panel__body">${body}</div>`);
}

export function kv(label, value) {
  return `<div class="kv"><span class="muted">${label}</span><span>${value}</span></div>`;
}

export function emptyState(text) {
  return `<p class="muted">${text}</p>`;
}

export function cards(id = "", { className = "" } = {}) {
  const classes = className ? `cards ${className}` : "cards";
  const attr = id ? ` id="${id}"` : "";
  return `<div class="${classes}"${attr}></div>`;
}
