# UIQ-08 candidate — Codex independent review

Reviewed 2026-10-12 against the actual `codex/uiq08-candidate` diff, the
rendered preview and hash-bound report in `evidence/browser-report.json`.

## Decision

Accept Slice 757 as a completed isolated visual candidate. Do not integrate or
deploy it as app behavior. The candidate adapter only adds classes to existing
toolbar/button/output nodes; it does not change listeners, text, attributes,
button order, inline styles, zoom state, viewport, scroll, or artwork. The
stylesheet is local, scoped, dependency-free, has an opaque baseline and
forced-color support. The standalone page is clearly marked as non-production.

The rendered current-surface comparison shows better grouping and legible,
usable controls. It also confirms that the toolbar is in normal flow above the
inspection viewport: no artwork is behind it, so translucency/blur has no
meaningful product benefit in the actual layout. Keep the solid grouping as a
possible future integration; reject carrying the glass effect forward unless a
separate, evidence-backed layout decision makes it useful. Do not move the
toolbar over the artwork to manufacture that effect.

## Verification

- Focused Vitest: 3/3 passed; 100% statements, branches, functions and lines.
- Strict candidate preview typecheck: passed.
- `npm run build`: passed; existing large-chunk warning remains. Production
  asset names and SHA-256 identities are recorded in `CANDIDATE-EXIT.json`;
  neither asset contains the candidate class.
- Browser verifier: all 17 checks passed at 320, 360, 390, 480, 768, 1280 and
  1440 px; pointer and keyboard zoom, 50–250% bounds, Fit, retained scroll and
  artwork geometry passed. axe reported zero WCAG 2.1 A/AA violations. Opaque,
  dense local backdrop, forced-colors and reduced-motion cases passed. Contrast
  exceeded 4.5:1 for text and 3:1 for the non-text border across the measured
  backdrops. External requests and page errors: zero.
- Initial `npm run coverage` under the repository's default parallel workers
  passed 162 files/2,669 tests and had 3 failures: two project UI timing/progress
  failures and one unrelated S425 replay timeout. The three failed tests passed
  in isolation. A full rerun with two fork workers (command-line override only)
  passed all 165 files/2,672 tests and global statements, branches, functions
  and lines at 100% (33,129 statements/lines, 17,302 branches, 1,899
  functions). The worker default/configuration was not changed. This confirms
  the failures were contention-sensitive, not candidate regressions.
- No app source, app entry, feature flag, dependency, release configuration or
  export baseline was changed. No production integration or deployment occurs.

Machine report and screenshots are under `docs/research/uiq08/evidence/`;
their hashes and the candidate source hashes are in `CANDIDATE-EXIT.json`.

## Boundary after acceptance

The candidate child may be closed Done after attaching this review and exit
evidence. The parent UIQ-08 remains Backlog/unshipped. The next product action is
a separate maintainer-approved admission for app integration (solid treatment
only, unless new rendered evidence establishes a reason for translucency).
