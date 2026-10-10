export function renderBars(rows) {
  const max = Math.max(1, ...rows.map((row) => row[1]));
  const bars = rows
    .map(
      ([label, value]) => `
      <div class="bars__row">
        <span class="bars__label">${label}</span>
        <div class="bars__track">
          <div class="bars__fill" style="width:${((value / max) * 100).toFixed(1)}%"></div>
        </div>
        <span class="bars__value num">${value}</span>
      </div>`,
    )
    .join("");
  return `<div class="bars">${bars}</div>`;
}
