# G04 V02 — Polo front POM leader crossing audit — Slice 379

## Start boundary

- Started 2026-10-02 20:25:22 UTC from S378 commit `bd8a6d69ff52a2a51efa3a52fd929d96d57c4498` on `codex/epic-17-g04`; implementation files were clean and the validated board start commands plus S379 packet were the only working-tree changes.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 378; reserve unique slice 379. Canonical board was revision 1910 at entry; validated start evidence advanced it to 1913. G04-V02 and EPIC-17 remain In Progress.
- Current integrated tally is 56 accepted / 90 held across 73 configurations / 146 faces; all 34 Polo faces remain held. Goal remains active and necessary through admitted G04 completion, full gates and safe merge.
- S377/S378 rendered close-ups show several remaining Polo collar/placket callout strokes crossing or running through neighboring labels and construction geometry. S378's comparison view suppresses only the C `Collar point extension` leader and preserves the exact rest of the front view. During S379, the maintainer approved S378's source-centered C marker and unchanged full-text schedule for all 17 options; record implementation for a separate S380 slice. It does not change this audit's scope or clear any remaining hold.
- Primary usage at start: 41% used; ordinary work is allowed. Weekly usage: 84% informational.
- No safe delegated task: source identity, leader path extraction, exact same-revision geometry comparison, option rows and visual review form one coupled audit. Codex owns the slice.

## Scope and acceptance

Audit the exact Polo `FRONT_FLAT` technical-flat POM leaders in the 17 supported option configurations, using the S378 diagnostic view only as a comparison surface that suppresses C's known blocked leader. Identify which emitted leader strokes intersect or come within the fixed 0.25 cm clearance of a non-target pattern-derived geometry path or other callout label. Bind each finding to exact POM source ID, source edge/mark, target entity, view revision, and affected option row.

- Recreate all 17 exact current source drafts and confirm source POM IDs, values, tolerances, target geometry IDs, source entities and revisions.
- Extract actual emitted callout leader segments and source-derived path geometry from SVG output. Exclude only each leader's exact target edge/mark from unrelated-obstacle tests; record the chosen geometric approximation and tolerance.
- Evaluate leader/path clearance, crossings, leader/leader intersections, and label-box overlap where the SVG text geometry supports a measured bound. Treat anchor contact with its own target as intentional.
- Record every pass/fail with the exact involved entities, distance/crossing, and configuration. Do not infer physical construction or change any source geometry, stitch graph, POM, threshold or view metadata.
- Render and manually inspect the default and option extremes that produce findings, plus representative unaffected output. Preserve all exact current POM text/value/tolerance and disclose colorway omission.

## Non-goals and gates

No production implementation, board acceptance, face release, export changes, gate relaxation, callout relocation, new construction convention, physical/factory claim, broad UI work, or V02/V03 advancement. No production test or global coverage/build gate is expected unless production source changes; settled integrated PR gates remain required.

Focused evidence: reproducible 17-row source identity matrix, geometric collision summary with explicit bounds, actual SVG/PNG, Chromium error count, manual visual review, validated board exit, `npm run control-center:test`, `git diff --check`, and board-reference/status consistency.

## Exit record

### Evidence method and identity

- The reproducible `audit-leaders.mjs` parses the actual S378 same-revision diagnostic SVG outputs for all 17 S331 option rows. It confirms the row IDs and `live-draft:polo:S378:<caseId>` revisions against the S331 matrix, then requires every extracted pattern path and POM group to carry that same revision. Every leader keeps the SVG's exact POM source ID, mapped target entity and source edge/mark. The C leader is absent by design in the S378 comparison view; the C key and unchanged full-text schedule remain visible. Any non-emitted source POM remains outside this emitted-leader audit.
- The renderer emits 13 POM leaders in 16 configurations and 12 in `polo-sideVentDepth-min` (220 leader instances total). Do not interpret the emitted count as total Polo POM count: some source POMs are intentionally schedule-only/omitted in this comparison or fail closed upstream.
- A leader is its actual straight SVG `M…L…` segment. `M/L/Z` pattern geometry is segmented exactly; cubic `C` paths are sampled at 200 equal parameter intervals. Distances use viewBox centimetres. The 0.25 cm cutoff is the unchanged G04/Polo review gate; exact zero denotes intersection with the sampled polyline. This geometric representation does not certify sub-sample cubic extrema, physical construction, or manufacturing meaning.
- Text uses Chromium `getBBox()` for each emitted `text[data-label-for]`; the emitted straight leader is compared with measured glyph bounds while excluding its own POM label. An SVG annotation label intentionally pointing at a mark/edge remains a different entity from the geometry; only true non-target text/path contacts are reported. Browser errors: zero. Diagnostic colorway fill is omitted.

### Results

- All 17 option rows have at least 10 emitted POM leaders closer than 0.25 cm to a non-target pattern-derived path. The `standFrontRise-min` row has 11; the other 16 each have 10. That is 171 under-threshold leader/path instances, including 141 segment intersections and 30 clearances above zero but below 0.25 cm. Eleven distinct source POM IDs fail at least one row; ten do so across all 17 rows and `front-body-length-hps-hem` additionally fails only `polo-standFrontRise-min`.
- Every failure is bound to the POM's exact SVG source/target and its nearest non-target obstacle in `per-pom-summary.json`. Recurring conflicts include: `across-shoulder` (`front.shoulder` → front outline) with `polo-sleeve-cap:front:armhole`; `body-chest-finished` (`front.side` → front outline) with the sleeve/outer-stand outlines; `button-spacing` (button-1 mark) with the button-placket outline; `finished-placket-length` (`buttonPlacket.attachmentRaw`) with the reflected base-reinforcement/clip marks; `finished-placket-width` (attachmentLine mark) with the button-placket outline; `front-neck-drop` (`front.neckline`) with the button-placket outline; `neck-width` and `shoulder-seam` (`front.shoulder`) with `outerStand`; `sleeve-bicep-width` (`sleeve.sideLeft`) with the front outline; and `finished-pointed-collar-leaf` (`upperCollar.centerBack`) with the front outline or coincident under-collar/stand center-match marks. Exact IDs, option frequencies, measured clearance ranges and complete unchanged POM strings are in the machine-readable per-POM table.
- Three of the recurring POM leader pairs come within 0.25 cm in every configuration: body-chest/sleeve-bicep; finished-placket-width/front-neck-drop; and neck-width/shoulder-seam. Chromium glyph-bound tests find three actual leader-to-label intersections: finished-placket-width crosses the front and upper-collar `CENTER FRONT` labels at `polo-placketWidth-min`; shoulder-seam crosses `outerStand.shoulder` at `polo-standFrontRise-min`.
- Manually inspected whole and enlarged annotated output for `polo-default`, `polo-placketWidth-min`, `polo-standFrontRise-min` and `polo-collarPointExtension-max`. The overlays show red dashed leaders with exact source anchors; the minimum placket-width case has two independently measured label contacts. These are rendered readability failures, not merely path-metric warnings.
- No Polo configuration passes this callout/path portion of the 0.25 cm/readability review. This audit does not decide how to reroute or schedule the remaining labels. It changes no geometry, stitch graph, POM data, renderer behavior, option support or acceptance. All 34 Polo faces remain held; integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces. Preserve all-seven V02 and do not advance V03.

### User decision received during S379

The maintainer approved the S378 C marker centered at `upperCollar.frontTip:end` with the unchanged full `Collar point extension` text/value/tolerance in the keyed schedule for all 17 Polo options. This authorizes only that previously examined local display mapping. It fixes the two known base-render errors associated with that callout; it does not clear the leader crossings, the 0.25 cm sleeve residual, or any Polo face. S379 remains diagnostic-only. Reserve implementation and option/render/colorway verification for a fresh S380 packet.

### Exit verification and handoff

- `leader-crossing-matrix.json` contains 17 rows, exact revision and option overrides, extracted sources/targets, per-leader clearances, leader pair contacts, measured text contacts, and path counts. `per-pom-summary.json` indexes the exact source text, source entity, target, nearest non-target obstacle frequencies and clearance range. `annotated/` contains 17 SVG overlays plus whole/detail PNGs for the four manually inspected cases. `audit-leaders.mjs` is the reproducible parser/measurement harness.
- `npm run control-center:test` passes 42/42; `git diff --check` passes. The start board entry reached revision 1913; exit evidence was replayed through the Control Center command layer to revision 1930. No production code changed, so full global coverage/build/export gates remain for the settled integrated Epic/PR candidate.
- All 34 Polo holds, the fixed 0.25 cm gate, all-seven acceptance, V02-before-V03, legacy DXF behavior and protected export identities remain. Physical fit, factory acceptance and production readiness are not claimed.
- **Next slice:** S380 implements only the approved C marker plus full-text schedule. Verify all 17 options, same-revision identity, exact POM text/value/tolerance, readable whole/detail/schedule output and applicable colorway behavior. Do not release faces until all independent blockers, including the residual gate and the crossings recorded here, pass. Refresh Git/board and reserve the unique number again before implementation.
- **Elapsed:** about 13m (0m production implementation; 6m source/SVG audit and harness; 2m focused matrix/Control Center verification; 2m rendered review; 3m durable packet/state/board closeout; 0m external-agent waits; 0m blocking maintainer-decision time—the S380 approval arrived while S379 work continued, and the arrival timestamp is not separately exposed).
