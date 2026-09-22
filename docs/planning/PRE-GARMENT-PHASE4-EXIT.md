# Pre-garment Phase 4 — first-load tutorial verification

**State:** implementation and local verification complete; two independent
static reviews complete; accepted on the canonical board with evidence
`E-PREQUEUE-PHASE4-EXIT`. **Date:** 2026-09-22.

## Delivered

- A non-modal Welcome and five-step Garment → Measure → Style → Check/Export
  tour, with replay, Skip, reload resume, and version-3 local-state migration.
- Tour progress is separate from design data. Existing readiness and export
  gates remain authoritative; the tutorial never changes a measurement or
  starts an export.
- Invalid/implausible values remain visible with correction guidance. Users
  may continue the tour to Check, where Export stays gated and the correction
  action returns to the first flagged item.
- Stable tutorial rendering, keyboard-operable actions, visible focus, a polite
  screen-reader announcement, and responsive layout. A live check found the
  announcement text was visible; the markup now uses the app's established
  screen-reader-only class.

## Verification

- `npm run build` — passed.
- `npm run coverage -- --reporter=dot` — 105 test files and 1,434 tests passed;
  lines, statements, branches, and functions are each 100%.
- Protected export regression — 8/8; byte-identity — 9/9.
- `npm run control-center:test` — 25/25; `npm run web:release:test` — 10/10.
- Live browser: 1280×720 desktop and 600×838 narrow view; document width did
  not exceed viewport width. Keyboard advancement reached Measure, Style, and
  Check with visible focus. Chest `160` stayed unchanged, surfaced the
  proportion warning, blocked Export at Check, and the correction route
  returned focus to the chest field. Skip preserved the current design;
  replay opened Welcome; reloading at Welcome restored that step.
- Saved-workspace migration stays suppressed but retains the established
  Measure entry. The focused regressions exercise this path and valid active
  tour resume even when a workspace already exists.

Claude and OpenCode performed independent read-only source reviews and found no
blocking defects. Neither reviewer ran tests, coverage, or browser checks; the
verification above was run in the main checkout. The polite live status now
announces step progress while focus names the heading, avoiding repeated title
text. This has not been verified with a screen reader.

The 600px narrow check exercises the app's ≤700px layout. This is rendered UI
evidence, not a broad usability study. The saved-workspace return path was
covered by tests but not rechecked in the browser. No garment has been sewn or
physically fit-tested; no manufacturing or production-readiness claim is made.
The work adds no service, account, dependency, or recurring/one-time cost and
does not move any export baseline.
