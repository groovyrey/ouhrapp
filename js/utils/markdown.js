function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/^### (.+)$/gm, "<strong>$1</strong>");
}

function renderBlock(line) {
  if (/^### /.test(line)) return `<p class="md-h">${inline(line.slice(4))}</p>`;
  if (/^## /.test(line)) return `<p class="md-h">${inline(line.slice(3))}</p>`;
  if (/^# /.test(line)) return `<p class="md-h">${inline(line.slice(2))}</p>`;
  if (/^[-*] /.test(line)) return `<li>${inline(line.slice(2))}</li>`;
  if (/^\d+\. /.test(line)) return `<li>${inline(line.replace(/^\d+\. /, ""))}</li>`;
  return `<p>${inline(line)}</p>`;
}

export function renderMarkdown(text) {
  const source = escapeHtml(String(text ?? "")).replace(/\r/g, "");
  const blocks = source.split(/```/);
  let html = "";

  for (let i = 0; i < blocks.length; i++) {
    if (i % 2 === 1) {
      html += `<pre class="md-code"><code>${blocks[i].replace(/^[^\n]*\n/, "")}</code></pre>`;
      continue;
    }

    const lines = blocks[i].split("\n");
    let list = [];
    const flush = () => {
      if (!list.length) return;
      html += `<ul>${list.join("")}</ul>`;
      list = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flush();
        continue;
      }
      if (/^([-*] |\d+\. )/.test(trimmed)) {
        list.push(renderBlock(trimmed));
      } else {
        flush();
        html += renderBlock(trimmed);
      }
    }
    flush();
  }

  return html;
}
