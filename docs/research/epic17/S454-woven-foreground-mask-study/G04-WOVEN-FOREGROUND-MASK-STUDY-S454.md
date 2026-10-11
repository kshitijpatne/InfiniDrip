# G04 Woven foreground-mask study — Slice 454

## Start boundary

- Started 2026-10-08 02:07 UTC from clean S453 `383560ca737494025a07daacad4637ce3c1e7bff` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of HEAD. Highest assigned slice is 453; S454 is reserved.
- Board revision 2731; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held across 73 configurations / 146 faces. Goal is active and matches the admitted objective.
- Usage at start: primary 10%, weekly 24%; ordinary work allowed.
- S453 corrected a prior candidate description: the `0.8426–0.8433 cm` center-to-contact clip removes the body neckline in the open V, not where collar leaves cover it. Do not reuse it as a foreground mask.

## Objective and authority

Conduct a proposal-only study using the exact same-revision Woven pattern/renderer output to determine whether the projected foreground collar silhouettes actually cover any segment of the body `front.neckline` stroke in each of the 28 supported options. If they do, measure the exact covered intervals and create rendered trial overlays; if they do not, establish that from path/fill geometry and retain the hold. Bind every row to `live-draft:woven-shirt:14:14`, exact piece/edge IDs, the source join graph, approved S359 projection and S406 collar/placket layering.

This slice does not implement or persist view semantics. S425's continuous base-seam decision remains authoritative; no trial may be described as approved or shipped. All Woven/Polo face holds, all-seven V02, V02-before-V03, the 0.25 cm Polo gate, fixed S370 band positions, legacy DXF behavior, protected export identities and V03 rights/round-trip gates remain unchanged.

## Exact study questions

1. In current production output, which stroked `front.neckline` instances and projected collar fill/silhouette entities participate in the two repeated contacts?
2. For each exact option, what source-parameter intervals of the neckline lie inside the actual projected collar-leaf silhouette? Distinguish opaque fill coverage from stroke-to-stroke intersections and from open-V segments.
3. Does masking only the geometrically covered intervals remove the repeated contacts while retaining visible neckline through every uncovered/open-V segment and preserving the intended continuous source seam representation?
4. Does an exact SVG/browser overlay remain clear with the existing approved collar-over-plackets mask, colorway, source marks, viewBox and annotations? Does any effect depend on option values?

## Scope and non-goals

- Allowed: regenerate/render current exact source output; inspect SVG entities and fill/path geometry; create offline analysis scripts, per-option matrices, candidate-only SVGs and rendered evidence; conclude no interval exists or candidate remains a design choice.
- Prohibited: editing production renderer, projection map, recipe or pattern source; changing source stitches, POMs, colorway semantics, fixed S370 side-gutter band layout, face holds, acceptance criteria or S425 decision; changing exports/baselines; claiming physical/factory behavior; starting V03.
- No independent low-risk external assignment is safe: interpreting the precise rendered fill/stroke stack and measuring the candidate across source-bound option outputs is one coupled geometry/render audit. Codex owns the study and output review.

## Required evidence and gates

- Use current production renderer output where available; confirm code and pattern revision are current rather than assuming historical S406 SVGs remain authoritative.
- Preserve exact source/entity/revision references, stable option/config IDs, SVG fill rules/masks and path parameter intervals in a reproducible matrix.
- Render actual baseline/candidate comparisons in Chromium for all 28 Woven front configurations, with at least default and geometrically extreme crops inspected at readable scale; report browser errors and missing/changed identity count.
- Demonstrate that uncovered neckline remains visible and no clip extends past true silhouette coverage. Check collar/placket overlap, source-mark intersections, colorway fills and all existing independent holds.
- If geometric coverage cannot be proven or candidate obscures unsupported geometry, reject it and retain all 28 Woven front holds. No maintainer decision is requested until a concrete output and measurable tradeoff exist.
- Run focused scripts/verification and `npm run control-center:test`, validate board preflight/replay/read and `git diff --check`. This is a proposal-only slice with no production-code coverage/build/export gate unless production code is touched (prohibited here); settled Epic gates remain required at PR boundary.

## Start board record

Validated start commands are adjacent. No status transition is authorized.

## Result

### Current-output and topology findings

- Regenerated the front views by importing the current `GARMENTS`, drafting, live-view compiler and production SVG renderer through the current Vite build. The output is bound to `live-draft:woven-shirt:14:14` at renderer/source checkout `383560ca737494025a07daacad4637ce3c1e7bff`. All 28 supported option configurations emitted FRONT_FLAT; compile issues 0, renderer issues 0, browser errors 0. This is a fresh replay, not reliance on the historical S406 SVGs.
- Each output contains the unchanged source-derived body seam entities `flat:woven-shirt:FRONT_FLAT:view-seam:front:neckline` and its `physical-pair-reflection`, both sourced from `pattern:woven-shirt:role:front:edge:neckline`. The source stitch directly joins `front.neckline` to `outerStand.neckline`. `underCollar` and `upperCollar` leaves are separate roles projected from their own source edges; the exterior contact itself is not a direct neckline-to-leaf stitch.
- Measured the two emitted neckline paths against the browser's actual filled `underCollar` and `upperCollar` path geometry using SVG `getPointAtLength` and `isPointInFill`. Excluded `outerStand` fill from the leaf mask because its boundary coincides with the source-joined body/stand base seam; boundary membership there is not evidence that a leaf covers the seam. Each mirrored line has one leaf-filled interval from its first leaf-boundary contact to the shoulder endpoint. Across options, the visible center-front/open-V segment is `0.5034–1.2838 cm` per side; the leaf-covered interval is `13.2536–14.4041 cm` per side. The exact same-revision leaf-fill start points match the recurrent center contacts to within `0.000196 cm` (maximum across 56 points).
- The fresh path-intersection audit finds, in every option, two center neckline/leaf contacts and two separate source-joined shoulder endpoints. The exact silhouette mask starts at the two center contacts; it does not gap the open V. No unsupported gap, source seam edit, or pattern/stitch change is introduced by the trial.

### Candidate-only render

- Created a trial SVG for every one of the 28 fronts. It applies an SVG luminance mask only to the two unchanged `front:neckline` stroke entities: white elsewhere and black from the actual emitted filled `underCollar`/`upperCollar` silhouettes. It does not mask other source paths or the base stand seam, and it does not change the body path `d`, source IDs, piece/revision identity, option values, colorway, or existing collar-over-plackets mask.
- All 28 candidate SVGs rendered with 0 browser errors. Codex inspected default, `standHeight` min/max, `collarLeafDepth` min/max, and `combined-supported` crops. The body seam remains visible through the open V and stops at the projected leaf contours; the crossing stroke inside the leaf silhouettes disappears. All option images are preserved under `leaf-mask-trial/rendered/`; the current-renderer baseline crops are in `current-production-replay/rendered/`.
- **This is a proposed layer-order convention, not a fact proven by the pattern or books.** The exact geometry supports where the projected leaves cover the line; generic book examples show collars covering necklines in flats. Neither establishes that this product should hide the source-joined base seam. The visual consequence is substantial: it hides `13.2536–14.4041 cm` of the body neckline per side and leaves only `0.5034–1.2838 cm` visible in the open V. It visually interrupts the continuous visible neckline and therefore supersedes S425 if adopted. The line ends at the leaf boundary, a display endpoint rather than a source-authored stitch junction.

### Decision required before any production mapping

1. **Approve the exact leaf-silhouette mask convention** for trial implementation and all-option verification. It preserves complete source path geometry and hides only pixels covered by the same-revision upper/under collar fills, retaining the measured open-V segment. This supersedes S425's continuous-visible-neckline decision and clears only the repeated front neckline/leaf crossing if the production implementation reproduces the 28-option output. It does not clear the 28 Woven backs, the all-seven V02 gate, or any other held faces.
2. **Keep S425 unchanged and retain all 28 Woven front holds.** No code or acceptance changes; the V02 front blocker remains.

S442 remains unchanged: preserve S370 band positions and all 28 Woven back holds. All 56 Woven and 34 Polo faces remain held; tally stays 56 accepted / 90 held. No face is accepted by this study.

## Exit record

- **Board:** start replay 2731→2733; exit/evidence/link/comment commands advanced 2733→2741. Validated compatibility summaries advanced the board to revision 2748. EPIC-17/G04-V02 remain In Progress and G04-V03 Backlog; tally 56 accepted / 90 held. Historical summary phrases required by current regression assertions were restored additively. The full board suite first identified two missing historical phrases, then one additional legacy phrase; all failures were recorded and resolved without changing current S454 facts or holds.
- **Verification:** current production replay 28/28 with 0 compile/renderer/browser errors; candidate-only render 28/28 with 0 browser errors; coverage/contact audits span all 28 rows and 56 mirrored seam paths; `npm run control-center:test` passes 42/42 after summary repair; all S454 JavaScript modules parse; board preflight/replay passed; `git diff --check` passed.
- **Implementation:** 0m; no product source, test or behavior changed. **Agent waits:** 0m (no safe disjoint assignment). **Maintainer decision:** pending on superseding S425; elapsed time 0m at this boundary.
- **Elapsed:** 02:07–02:18 UTC (~12m): current-source replay and SVG inspection ~2m; coverage/crossing analysis ~2m; candidate generation/render review ~3m; durable records/board ~3m; focused verification ~2m; production implementation 0m; agent waits 0m; maintainer-decision time 0m so far.
- **Next action:** wait for the concrete S425 disposition above. If approved, implement only the exact source/revision-bound leaf silhouette mask in a fresh slice, verify the full 28-option matrix and rendered output, and preserve all holds. If declined, retain front holds and continue the remaining V02 block without changing S425.
