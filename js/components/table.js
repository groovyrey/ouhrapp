export function renderTable({ columns, rows }) {
  const head = columns.map((column) => `<th>${column}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
    )
    .join("");

  return `
    <table class="table">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
