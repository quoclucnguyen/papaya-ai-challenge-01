# AI Challenge 01 — Insurance Plan Comparison Page

A static, dependency-free web page that compares three health insurance plans (Bronze / Silver / Gold) side by side.

## How to run

No build step. Either:

- Open `index.html` directly in a browser, or
- Serve the folder: `npx serve .` and open the printed URL.

## Approach & decomposition

1. **Model the data** ([js/data.js](js/data.js)) — the plan JSON from the brief, untouched, plus the two domain conventions made explicit: `-1` = unlimited, `null` = benefit not included.
2. **Describe the comparison declaratively** ([js/config.js](js/config.js)) — each table row is a config object: `label`, `get(plan)` accessor, `render(value)` formatter, and a `best` direction (`min`/`max`). Adding a new benefit row = adding one object; no rendering code changes.
3. **Render two views from one config** ([js/app.js](js/app.js)) — a semantic `<table>` for desktop and stacked cards for mobile are both generated from the same `SECTIONS` config, so the two layouts can never show different values. CSS media query (≤760px) switches between them.
4. **Style** ([css/styles.css](css/styles.css)) — design tokens via CSS variables, plan accent colors, print-clean professional look.

## Key decisions

- **Recommended badge** is computed, not hard-coded: `score = annual_limit × (1 − copay%) / annual_premium` — effective coverage accessible per $1 of premium. Gold wins ($595 vs $321 vs $222). The score is shown as its own row ("Value for money") with a footnote, so the badge is explainable to a non-technical reader.
- **Best-in-row highlight** uses a rank function: `null` → worst, `-1` (unlimited) → best, direction per row (`min` for premium/copay/waiting, `max` for limits). Ties highlight all winners; rows where nothing is covered or everything ties highlight nothing.
- **Vanilla HTML/CSS/JS, no framework** — the brief is a single data-driven page; a framework would add a build step without adding clarity. Code organization comes from the config-driven design instead.
- **Currency** — the brief gives bare numbers; rendered as USD (`$1,500,000`) with a footnote. One place to change (`formatMoney`).

## Edge cases handled

- `-1` (unlimited) → "Unlimited" pill, ranked as best possible value.
- `null` benefits → "✕ Not covered" with red indicator, ranked as worst.
- `0` copay / `0` waiting days → rendered as "0% — no copay" / "None" (not just a bare zero).
- Ties in a row → all tied cells highlighted; no highlight when all plans tie.
- Accessibility: semantic table with `scope`/`caption`, visually-hidden "(best value)" text for screen readers, indicators are icon + text (not color-only), `lang`, `noscript` fallback.

## Structure

```
challenge-01/
├── index.html          # page shell, legend, footnotes
├── css/styles.css      # design tokens + layout (table / cards)
└── js/
    ├── data.js         # plan data (verbatim from brief)
    ├── config.js       # row config, formatters, scoring, best-in-row logic
    └── app.js          # renders table + cards from config
```

## Timeline

Estimated ~2.5 hours: problem breakdown & data modeling (30m), config + rendering (60m), styling & responsive (45m), verification on desktop/mobile viewports & writeup (15m).
