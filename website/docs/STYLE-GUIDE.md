# Style Guide — Caption Light (living document)

Single source of truth for layout and styling decisions. **Every layout/styling
change must be recorded here.** Before building or changing a page: read this
file. After changing it: update this file in the same commit.

Goal: every page shares the same visual system, so the site reads as one
product — not a pile of data dumps.

---

## 1. Layout primitives

| Primitive | Rule |
|---|---|
| `section` (any) | max-width 64rem, centered, padding 2.5rem 1.5rem. This is the page column. |
| `.page-head` | h1 + optional `.lead`. `padding-bottom: 0` — the NEXT section's top padding provides the gap. Never add extra margins under a page head. |
| `.card` | surface bg, 1px line border, radius, shadow, 2rem padding. The standard content box. |
| `.card + .card` | margin-top `--gap`. Stacked cards ALWAYS get this — never zero gap, never custom margins. |
| Grids of cards (`.dashboard-grid`, `.packages`, `.services`, `.steps`) | `repeat(auto-fit\|auto-fill, minmax(Xrem, 1fr))`, gap `--gap`. **No horizontal padding on the grid itself** — card outer edges must align with full-width cards above/below. |

### Spacing scale (only these values between blocks)
- `--gap` (1.5rem): between cards, inside grids, related small blocks.
- 2.5rem: section vertical rhythm (page column padding), heading-to-content gap.
- Nothing else. If a new spacing need appears, extend this list here first.

## 2. Cards with varying content (the pricing lesson)
Model names/descriptions have wildly different lengths. Rules so cards in a row
stay aligned:
- Card is `display: flex; flex-direction: column`.
- Title (`h3`): `min-height: 2.6em` (reserves 2 lines), `overflow-wrap: anywhere`.
- Long description: line-clamp (3 lines), `.svc-desc`.
- Bottom block (`.svc-meta`): `flex-grow: 1` + content pushed down → meta +
  price align at the bottom of every card in the row.
- Price (`.price`): last element, 1.7rem bold, unit as muted `span`.
- Numbers: `font-variant-numeric: tabular-nums` (`.price`, `.big-number`,
  `.data-table td:last-child`).

## 3. Header / navigation
- Brand + 3 page links + auth slot + theme toggle. Nothing page-specific.
- Auth slot: `#nav-login` link and `#nav-logout` button, toggled by
  1) inline pre-paint script in layout.html (no flash), 2) auth.js wiring.
  Logout → `AI.logout()` → redirect `/`.
- `[hidden] { display: none !important; }` exists because `.btn` sets
  `display:inline-block` and would beat the UA hidden rule. Never rely on bare
  `hidden` for elements with a display class.

## 4. Buttons
- `.btn` base; `.btn-primary` (accent, one per view), `.btn-ghost`,
  `.btn-small` (nav, table rows).
- A `<button>` for actions, `<a class="btn">` only for navigation.

## 5. Tables (dashboard lists)
`.data-table`: first column = timestamp (muted, nowrap), last column =
numeric (right-aligned, semibold, tabular). Row separators only, no zebra.

## 6. Forms
- Centered `.auth-card` (login) or `.card` blocks (options).
- `label` display:block, inputs full-width radius 8px; `.checkbox` is the only
  inline exception.
- Errors: `.form-error`; notices: `.notice`.

## 7. Text & states
- `.muted` secondary text; `.empty` for empty lists; `.lead` intro paragraph.
- Card `h2` = section label style (1.1rem, ink-soft). Page `h1` only in
  `.page-head`.

## 8. Theming
- Colors ONLY via tokens.css variables. Never hardcode colors in new rules.
  (Exception already grandfathered: severity red/orange + quality green/red
  pairs with their dark-mode overrides.)
- Dark mode = `[data-theme="dark"]` token overrides; test every new component
  in both themes.

## 9. JS-rendered content checklist
Before shipping JS that injects markup:
1. Every class it emits exists in main.css (grep both ways).
2. Every `getElementById` id exists in the template (grep both ways).
3. Text goes through `dict/` keys (page passes them via inline `*_I18N`
   objects — see job.html/window.JOB_I18N pattern).
4. Logic test in `tests/` if the rendering is non-trivial (see
   tests/render-readability.test.js DOM-stub pattern).

## 10. Page recipe (use for EVERY new page)
```
<section class="page-head">
  <h1>{{ @page.h1 }}</h1>
  [<p class="lead">…</p>]
</section>
<section class="card">…</section>        ← gaps automatic (.card + .card)
<section class="card">…</section>
```
Same h1 position, same card stack, same gaps on every page. Grids of small
cards go in a dedicated grid section (see §1), not nested `.card`s.

## 11. Verification before saying "done"
- `node --check` on every touched JS file.
- `rm -f website/tmp/*.php` after template/dict edits; curl every touched
  route → 200.
- Both themes: no hardcoded colors introduced.
- This file updated if any decision was made.

## Decision log
- 2026-09-20: Established system (this file): --gap scale, .card + .card gap,
  edge-aligned card grids, page-head padding fix, pricing card structure
  (bottom-aligned meta+price, clamped desc, reserved 2-line titles), data-table
  column alignment, .detect-result panel, [hidden] guard, focus-visible,
  nav login/logout swap (pre-paint script + auth.js), dashboard-head removed
  in favor of plain page-head.
