# G04 V02 measured technical-flat label reflow — Slice 273

## Boundary

- **Goal start:** 2026-09-29 20:57:56 UTC.
- **Starting Git:** Slice 272 landed as `39f943495857c008d78b3f0d4bbb3194c6160009`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Active history contains unique S270–S272; S273 is reserved. The worktree is clean on `codex/epic-17-g04`.
- **Starting board:** revision 400. EPIC-17 is In Progress; G04-V01 is Done, G04-V02 is In Progress with verified S272 output evidence, and G04-V03 is Backlog. The validated S273 start comment moved the board to revision 401. S271's retained browser matrix has 14 default faces, with six actual-font `TEXT_COLLISION` blocks (Polo, Woven-shirt and Trouser, both faces).
- **Scope:** reflow semantic labels and POM annotations using the exact active-browser metrics on each of the seven default recipe front/back views. Preserve the 2D garment geometry, POM anchor and leader targets, layer order, source/revision metadata, colorway/artwork overlays, and the existing readable canvas scale. Make measured placements deterministic and reject any true unresolved overlap or clipping.
- **Acceptance:** exercise all 14 default front/back faces in the real application using active browser font metrics. Accepted SVG faces parse at one shared front/back draft revision per recipe when both faces are source-supported, with no overlap between labels, visible geometry strokes, artwork bounds or POM leaders; source notices are visible and unclipped. Existing source assembly cycles remain fail-closed with their actionable correction instead of yielding a misleading face. No font estimate may silently replace unavailable browser metrics. A view that cannot satisfy layout still fails closed with a specific issue.
- **Required gates:** focused changed-code tests at 100% statement/branch/function/line coverage; `npx tsc --noEmit`; `npm run build`; production Chromium render/parse matrix for all 14 defaults with retained text bounds and screenshots/SVGs; mounted live view smoke; protected generic-DXF/export identity group; validated Control Center evidence; `git diff --check`; update architecture, context, admission, project state and board.
- **Blocking decisions:** none. Use the S271 browser matrix as the reproducible six-face baseline and the S272 real-browser UI binding as the product surface. No construction feature may be invented to make a label easier to place.
- **Non-goals:** full supported-option endpoint sweeps and final V02 mapped-MQF reconciliation (S274/S275); new annotations or source mappings; changing POM values/anchors; redesigning pattern geometry; generic DXF/CAD work; broad UI redesign; G09/D04 side/oblique/inside views; G05 production tech-pack content; new recipes; physical sampling; supplier contact; launch spending; hosted service; production-readiness claims.
- **Delegation:** text layout, measured SVG output, semantic collision detection and the seven-recipe browser matrix share one renderer contract; no safe disjoint ownership is identified, so Codex retains the slice.

## Exit evidence

### Result

- **Implementation:** `src/render/technical-flat-svg.ts` now measures labels in
  the active browser and searches deterministic nearby positions. Candidate
  boxes keep a 0.08 cm gap from other labels, visible sampled path strokes,
  artwork bounds, and existing/proposed POM leaders. The search checks the
  authored point first and searches 48 rings at 0.25 cm increments. It moves
  only label presentation and the POM leader endpoint; semantic geometry,
  source/revision identity and the POM's primitive anchor/target remain intact.
  If no location is available, the entire SVG remains withheld with a specific
  `TEXT_COLLISION` issue. Notice-panel line spacing, top/bottom padding and
  height now derive from measured browser ascent/descent; this was corrected
  after the stricter browser glyph-box check found 0.03 cm of first-line
  clipping at the prior panel top.
- **Rendered evidence:** `ops/web/verify-g04-s273-label-reflow.mjs` built the
  production preview, exercised all seven recipes and both faces at a
  1440 × 3000 Chromium viewport, and retained `S273-browser/matrix.json`, one
  SVG and screenshot per accepted face, and one screenshot per withheld face.
  Eleven accepted faces parsed with a live-draft revision on every face and a
  shared front/back revision for each complete rendered pair. Their
  active-browser glyph bounds have zero text/text overlap,
  fit the SVG viewBox, and terminate all rendered POM leaders at their measured
  labels. Notice text fits both its visible panel and the SVG viewBox. There
  were no browser console errors, page errors, or remote-service requests.
- **Withheld faces:** Woven-shirt back remains blocked by the existing
  `Woven sleeve-cap ease` inconsistent sewn-placement cycle. Trouser front
  remains blocked by `Right front fly ↔ shield`; Trouser back remains blocked
  by `Waistband (four legs ↔ separate waistband)`. Their actual UI screenshots
  show the full-face hold and source-specific assembly guidance. No source
  geometry was changed to bypass these gates. These assembly conflicts remain
  recorded as V02 integration risks for a separately admitted source/assembly
  slice if the option matrix requires it.
- **Manual output review:** examined Tee, Polo front/back, Woven-shirt front,
  and the visibly blocked Trouser front alongside the retained all-face
  screenshots. Measured text is separate and within the view frame. The
  current rigid role assembly still places source components in overlapping
  layouts that do not form qualified garment silhouettes; residual construction
  notices remain visible. This is retained digital draft evidence, not a
  professional technical-design acceptance, physical-fit finding, or factory
  acceptance. Pattern-linked side/oblique/inside, production tech-pack, and CAD
  remain in their admitted later scopes.
- **Mapped MQF review:** the durable findings register already marks the
  applicable findings **To be reviewed**. At this interim rendered-output
  checkpoint, MQF-004 is **partial** (Woven-shirt buttons are present on the
  rendered front; its back is source-blocked); MQF-005 is **partial** (mapped
  construction labels are in the flat but detached pattern-key questions remain);
  MQF-006 is **partial** (measured label placement is traceable to its
  primitive, while source labels without a leader can still lack a precise
  target-area cue); MQF-007 is **partial** (11 faces pass visible-label
  collision review, with three source-blocked and supported-option checks
  pending); MQF-011 is **partial** (existing same-revision artwork boundary
  and colorway behavior remain, while the default screenshot matrix has no
  artwork fixture; deeper placement interaction remains post-G17 deferred);
  MQF-012 is **partial** (Polo output is visible, but this review does not
  resolve the retained collar/construction concern); MQF-015 is **not yet
  applicable** to this renderer slice and remains **To be reviewed** at V03's
  CAD export/round-trip exit. These classifications schedule no remediation
  beyond admitted S274/S275 work and respect the findings document's post-G17
  deferrals.
- **Focused coverage:**
  `npx vitest run src/render/technical-flat-svg.test.ts --coverage --coverage.include=src/render/technical-flat-svg.ts --maxWorkers=1 --minWorkers=1`
  passed 13/13 tests at 100% statements, branches, functions and lines.
  `npx vitest run src/render/technical-flat-svg.test.ts src/render/technical-flat-live.test.ts src/ui/app.test.ts -t "shows live front and back technical flats|compileTechnicalFlatLiveView|renderTechnicalFlatSvg" --maxWorkers=1 --minWorkers=1`
  passed 19 tests (268 unrelated app tests skipped); the mounted smoke now
  confirms readable Polo SVG faces instead of expecting the prior label block.
- **Build and protected outputs:** `npm run build` passed TypeScript and Vite
  production build (existing large-chunk advisory only). Generic DXF, export
  regression, and tech-pack surface suites passed 24/24; protected export byte
  identities are unchanged.
- **Boundary status:** renderer and rendered-label acceptance passed for every
  produced SVG. The 14-face application matrix was exercised; 11 faces rendered
  and parsed, while the three named pre-existing assembly-cycle cases stayed
  fail-closed with visible guidance. No layout collision remains among the
  produced SVG faces. This slice does not clear those source cycles or close
  G04-V02; all-option and mapped MQF checks remain pending for S274/S275.
- **Blocking decisions:** none. The named source cycles are nonblocking for
  this renderer-only boundary and remain explicit V02 evidence. No external
  agent wait or maintainer decision was required.
- **Board:** validated `addEvidence` linked `E-G04-S273-EXIT` to G04-V02 at
  revision 402; validated `addEpicEvidence` linked it to EPIC-17 at revision
  403. Both entries point to this report; the retained face matrix and
  screenshot/SVG artifacts are linked from its rendered-evidence section.
- **Next gate:** commit one `Slice 273:` change, then re-read refs/history and
  admit/reserve S274 for the supported-option topology sweep and applicable MQF
  review.
- **Elapsed from goal start (about 34m at 2026-09-29 21:32 UTC):**
  implementation and changed tests ~8m; focused verification ~8m; Chromium
  matrix and output review ~7m; durable documentation and board evidence ~11m;
  external-agent waits 0m; maintainer-decision time 0m. Rounded phase times are
  estimates from the retained command/run chronology.
