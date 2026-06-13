"use strict";

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

const formatMoney = (amount) => "$" + amount.toLocaleString("en-US");

/** Green check + value, for benefits that are included. */
const covered = (html) =>
  `<span class="indicator yes" aria-hidden="true">✓</span><span class="cell-value">${html}</span>`;

/** Red cross + label, for benefits that are not included. */
const notCovered = () =>
  `<span class="indicator no" aria-hidden="true">✕</span><span class="cell-value muted">Not covered</span>`;

const unlimited = () => `<span class="pill-unlimited">Unlimited</span>`;

/** Money amount that may be missing (benefit not included). */
const moneyOrNotCovered = (v) => (v == null ? notCovered() : covered(formatMoney(v)));

/** Count per year that may be missing or unlimited. */
const countOrNotCovered = (v) => {
  if (v == null) return notCovered();
  if (v === UNLIMITED) return covered(unlimited());
  return covered(String(v));
};

/* ------------------------------------------------------------------ *
 * Value-for-money score — drives the "Recommended" badge.
 *
 * Score = effective annual coverage you can access per $1 of annual
 * premium, where copay reduces the coverage the insurer actually pays:
 *
 *   score = annual_limit × (1 − copay%) / (monthly_premium × 12)
 * ------------------------------------------------------------------ */

const valueScore = (plan) => {
  const annualPremium = plan.monthly_premium * 12;
  const insurerShare = 1 - plan.copay_percentage / 100;
  return (plan.annual_limit * insurerShare) / annualPremium;
};

/* ------------------------------------------------------------------ *
 * Comparison rows.
 *
 * Each row declares how to read a value from a plan, how to render it,
 * and which direction counts as "best" so the winning cell can be
 * highlighted ("max", "min", or null for no highlight).
 * ------------------------------------------------------------------ */

const SECTIONS = [
  {
    title: "Pricing",
    rows: [
      {
        label: "Monthly premium",
        get: (p) => p.monthly_premium,
        render: (v) => `<strong>${formatMoney(v)}</strong><span class="muted"> /month</span>`,
        best: "min"
      },
      {
        label: "Annual coverage limit",
        get: (p) => p.annual_limit,
        render: (v) => formatMoney(v),
        best: "max"
      }
    ]
  },
  {
    title: "Outpatient care",
    rows: [
      {
        label: "Limit per visit",
        get: (p) => p.benefits.outpatient?.limit_per_visit ?? null,
        render: moneyOrNotCovered,
        best: "max"
      },
      {
        label: "Visits per year",
        get: (p) => p.benefits.outpatient?.visits_per_year ?? null,
        render: countOrNotCovered,
        best: "max"
      }
    ]
  },
  {
    title: "Inpatient care",
    rows: [
      {
        label: "Limit per day",
        get: (p) => p.benefits.inpatient?.limit_per_day ?? null,
        render: moneyOrNotCovered,
        best: "max"
      },
      {
        label: "Covered days per year",
        get: (p) => p.benefits.inpatient?.days_per_year ?? null,
        render: countOrNotCovered,
        best: "max"
      }
    ]
  },
  {
    title: "Dental",
    rows: [
      {
        label: "Annual dental limit",
        get: (p) => p.benefits.dental?.limit_per_year ?? null,
        render: moneyOrNotCovered,
        best: "max"
      }
    ]
  },
  {
    title: "Maternity",
    rows: [
      {
        label: "Limit per pregnancy",
        get: (p) => p.benefits.maternity?.limit_per_pregnancy ?? null,
        render: moneyOrNotCovered,
        best: "max"
      }
    ]
  },
  {
    title: "Cost sharing & waiting",
    rows: [
      {
        label: "Copay (you pay)",
        get: (p) => p.copay_percentage,
        render: (v) =>
          v === 0
            ? `<strong>0%</strong><span class="muted"> — no copay</span>`
            : `${v}%<span class="muted"> of each bill</span>`,
        best: "min"
      },
      {
        label: "Waiting period",
        get: (p) => p.waiting_period_days,
        render: (v) => (v === 0 ? `<strong>None</strong>` : `${v} days`),
        best: "min"
      }
    ]
  },
  {
    title: "Value for money",
    rows: [
      {
        label: "Coverage per $1 of premium¹",
        get: valueScore,
        render: (v) => `<strong>${formatMoney(Math.round(v))}</strong>`,
        best: "max"
      }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * Best-in-row resolution
 * ------------------------------------------------------------------ */

/** Map a raw cell value to a comparable number. */
const rank = (v, dir) => {
  if (v == null) return dir === "max" ? -Infinity : Infinity; // not covered = worst
  if (v === UNLIMITED) return Infinity; // unlimited = best possible
  return v;
};

/**
 * Indices of the plan(s) holding the best value for a row.
 * Returns an empty set when the row has no winner: no `best` direction,
 * nothing covered, or every plan tied.
 */
const bestIndices = (row, plans) => {
  if (!row.best) return new Set();
  const ranks = plans.map((p) => rank(row.get(p), row.best));
  const target = row.best === "max" ? Math.max(...ranks) : Math.min(...ranks);
  const noneCovered = row.best === "max" ? target === -Infinity : target === Infinity;
  if (noneCovered || ranks.every((r) => r === target)) return new Set();
  return new Set(ranks.flatMap((r, i) => (r === target ? [i] : [])));
};
