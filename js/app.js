"use strict";

/* ------------------------------------------------------------------ *
 * Rendering. Both views (desktop table, mobile cards) are generated
 * from the same SECTIONS config so values can never drift apart.
 * ------------------------------------------------------------------ */

const BEST_MARK = `<span class="visually-hidden"> (best value)</span>`;

const recommendedBadge = () =>
  `<span class="badge-recommended" aria-label="Recommended plan">★ Recommended</span>`;

const highlightChips = (plan) =>
  `<ul class="chips" aria-label="${plan.name} plan highlights">` +
  plan.highlights.map((h) => `<li>${h}</li>`).join("") +
  `</ul>`;

/** Precompute the winning plan indices for every row. */
const buildBestMap = (plans) => {
  const map = new Map();
  for (const section of SECTIONS) {
    for (const row of section.rows) map.set(row, bestIndices(row, plans));
  }
  return map;
};

/* ---------------------------- Desktop table ---------------------- */

function renderTable(plans, recommendedIndex, bestMap) {
  const cols = plans.length + 1;

  const headCells = plans
    .map((p, i) => {
      const isRec = i === recommendedIndex;
      return `<th scope="col" class="plan-col plan-${p.name.toLowerCase()}${isRec ? " rec" : ""}">
          ${isRec ? recommendedBadge() : ""}
          <span class="plan-name">${p.name}</span>
          <span class="plan-price">${formatMoney(p.monthly_premium)}<small>/mo</small></span>
        </th>`;
    })
    .join("");

  const bodyRows = SECTIONS.map((section) => {
    const sectionRow = `<tr class="section-row"><th colspan="${cols}" scope="rowgroup">${section.title}</th></tr>`;
    const dataRows = section.rows
      .map((row) => {
        const best = bestMap.get(row);
        const cells = plans
          .map((p, i) => {
            const classes = [best.has(i) ? "best" : "", i === recommendedIndex ? "rec" : ""]
              .filter(Boolean)
              .join(" ");
            return `<td class="${classes}">${row.render(row.get(p))}${best.has(i) ? BEST_MARK : ""}</td>`;
          })
          .join("");
        return `<tr><th scope="row">${row.label}</th>${cells}</tr>`;
      })
      .join("");
    return sectionRow + dataRows;
  }).join("");

  const highlightCells = plans
    .map((p, i) => `<td class="${i === recommendedIndex ? "rec" : ""}">${highlightChips(p)}</td>`)
    .join("");
  const highlightsRow =
    `<tr class="section-row"><th colspan="${cols}" scope="rowgroup">Plan highlights</th></tr>` +
    `<tr class="highlights-row"><th scope="row">Highlights</th>${highlightCells}</tr>`;

  return `<table class="compare-table">
      <caption class="visually-hidden">Side-by-side comparison of Bronze, Silver and Gold insurance plans</caption>
      <thead><tr><th scope="col" class="corner-col"><span class="visually-hidden">Benefit</span></th>${headCells}</tr></thead>
      <tbody>${bodyRows}${highlightsRow}</tbody>
    </table>`;
}

/* ---------------------------- Mobile cards ----------------------- */

function renderCards(plans, recommendedIndex, bestMap) {
  return plans
    .map((p, i) => {
      const isRec = i === recommendedIndex;
      const sections = SECTIONS.map((section) => {
        const rows = section.rows
          .map((row) => {
            const isBest = bestMap.get(row).has(i);
            return `<div class="card-row${isBest ? " best" : ""}">
                <dt>${row.label}</dt>
                <dd>${row.render(row.get(p))}${isBest ? BEST_MARK : ""}</dd>
              </div>`;
          })
          .join("");
        return `<section class="card-section"><h4>${section.title}</h4><dl>${rows}</dl></section>`;
      }).join("");

      return `<article class="plan-card plan-${p.name.toLowerCase()}${isRec ? " rec" : ""}" aria-label="${p.name} plan">
          <header class="card-header">
            ${isRec ? recommendedBadge() : ""}
            <h3 class="plan-name">${p.name}</h3>
            <p class="plan-price">${formatMoney(p.monthly_premium)}<small>/mo</small></p>
            ${highlightChips(p)}
          </header>
          ${sections}
        </article>`;
    })
    .join("");
}

/* ---------------------------- Bootstrap -------------------------- */

function init() {
  const scores = PLANS.map(valueScore);
  const recommendedIndex = scores.indexOf(Math.max(...scores));
  const bestMap = buildBestMap(PLANS);

  document.getElementById("table-view").innerHTML = renderTable(PLANS, recommendedIndex, bestMap);
  document.getElementById("card-view").innerHTML = renderCards(PLANS, recommendedIndex, bestMap);
}

document.addEventListener("DOMContentLoaded", init);
