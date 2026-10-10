import { getReviews, setReviewRating } from "../store.js";
import { renderTable, viewHead } from "../components/index.js";
import { escapeHtml } from "../utils/index.js";

const RATINGS = [1, 2, 3, 4, 5];

export function performanceView(root) {
  function paint() {
    const rows = getReviews().map((review) => [
      escapeHtml(review.employee),
      `<span class="num">${escapeHtml(review.cycle)}</span>`,
      escapeHtml(review.status),
      `<select class="select select--mini" data-review="${review.id}">
        ${RATINGS.map((n) => `<option value="${n}" ${n === review.rating ? "selected" : ""}>${n}</option>`).join("")}
      </select>`,
    ]);
    root.querySelector("#reviews-table").innerHTML = renderTable({
      columns: ["Employee", "Cycle", "Status", "Rating"],
      rows,
    });
  }

  root.innerHTML = `${viewHead("Performance")}<div id="reviews-table"></div>`;

  root.addEventListener("change", (event) => {
    const id = event.target.dataset.review;
    if (!id) return;
    setReviewRating(id, Number(event.target.value));
    paint();
  });

  paint();
}
