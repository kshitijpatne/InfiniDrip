# G04 V02 — Woven POM output readability audit — Slice 429

## Start boundary and authority

- Started 2026-10-07 16:39:35 UTC from clean S428 `c481a1a38c61c3af0477dffbfa79ddddfa8c3a42` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 428; S429 is next unique. Board revision is 2529; EPIC-17/G04-V02 In Progress, V01 Done and V03 Backlog. `get_goal` reports the admitted EPIC-17 objective active and unchanged.
- S428 verified S406's exact Woven production output is still current at `live-draft:woven-shirt:14:14`; later production changes are Polo-only. S406's approved Woven D/W callout treatments remain in force. The maintainer confirmed all existing recommendations and holds; this slice requests no new decision at start.

## Scope

Audit Woven's exact source POM callouts, keyed D/W markers, source labels and schedules for overlap/readability across all 28 supported options and 56 front/back output faces. Reuse the S406 same-revision production SVG matrix, inspect actual Chromium layout, and identify any remaining repeatable text/marker/readability blocker attributable to a specific POM/source label and geometry.

## Acceptance and exit gates

- Bind every row to source revision `live-draft:woven-shirt:14:14`, exact recipe/options/face identity, source POM ID/target/anchor, and the complete source schedule. Fail closed on missing or duplicate rows/identities.
- Check actual rendered SVG text bounding boxes for text/text and text/key-marker overlap across all 28 options; retain exact matrix counts, collisions and source identities. Inspect the full default and the most crowded geometry-distinct output plus targeted readable crops in Chromium.
- Confirm Woven D/W marker anchors and full-text schedules remain the approved S402/S396/S406 treatment; do not move anchors, alter POM identities/values/tolerances, hide source marks, change geometry, or infer a physical mark from a view marker.
- Keep any new collision held. If a specific view-only text placement is the only remedy, return one exact proposal with source POM, current and candidate placement, closest geometry/labels, measured clearance, tradeoff and held faces; do not implement until approved.
- Preserve all 56 Woven and 34 Polo holds, 56 accepted / 90 held, all-seven-recipe V02, V02-before-V03, legacy DXF and protected export identities, the fixed 0.25 cm Polo residual gate, V03 rights/round-trip gates, and physical/factory claim limits.
- Reuse existing matrices and harnesses; focused audit/Chromium evidence only. Run Control Center tests for board changes, board schema/read validation and `git diff --check`. No changed production source means no changed-code coverage or full repository gate for this audit; reserve the one full gate for the settled Epic candidate.

## Non-goals and ownership

No production mapping, source/cut geometry, stitch graph, option, POM, schedule, layer order, threshold or acceptance change; no face release; no broad renderer/UI redesign, G05 tech-pack content, G09/D04 assembled views, new recipe, V03 receiver/profile selection, physical sampling, supplier contact, launch spending, hosted service, fit/factory/production-readiness claim. No safe independent low-risk task has disjoint ownership from same-revision callout geometry and rendered output; Codex owns the complete audit.

## Start-board record

Validated start replay is recorded in `S429-start-board-commands.json` and the start preflight/result. All board statuses are preserved.

## Exit record

Completed 2026-10-07 16:48 UTC from the S428 output evidence. The exact renderer fixture remains `live-draft:woven-shirt:14:14`; this slice changed only its audit script and durable records. No production mapping, geometry, source stitch graph, POM definition, layer order, gate or view status changed.

### Source POM inventory and view-specific output

Read the ten `WOVEN_SHIRT_POMS` definitions in `src/drafting/shirt.ts`, then traced each generated callout group/label and explicit not-represented notice in the exact S406 SVG output. The 28-option matrix records 223 emitted POM labels, 223 exact-bound callout groups, and 337 source-omission notices across 56 faces. Each emitted callout group carries the exact `live-draft:woven-shirt:14:14` revision and its expected source entity and target geometry:

- Front: `Body chest (finished)` → front outline / `front.sideUpper`; `Finished placket width` → button-placket outline / `buttonPlacket.top`; `Front button spacing` → button-1 marker target with button-1/button-2 source marks; pocket width/height → pocket outline / `pocket.top` and `pocket.sideRight`; sleeve-band depth → sleeve-band outline / `sleeveBand.sideRight`; and side-vent depth → front outline / `front.vent` while that source edge is represented. When `sideVentDepth` is zero, the view emits the explicit table-only notice instead of an unanchored callout.
- Back: `Back yoke depth` → back outline / `back.yokeSeam`.
- View-specific omissions remain explicit and do not infer mirrored anchors: body length and neck circumference have source edges not drawn on the assembled face; the back yoke POM has no front anchor; front-only POMs have no inferred back anchor. The matrix includes exact notice identities and labels. The flat displays these as table-only/not-represented notices, not numeric POM rows; this preserves the established V01 table-only behavior for geometry that is absent from a face. It adds no new numeric schedule or G05 tech-pack content.

The exact front schedule contains the two approved full keyed rows (`W Finished placket width` and `D Front button spacing`) on every option. The W/D rings retain their approved source stations and full keyed values/tolerances. Actual Chromium SVG layout measured 2,012 text nodes across all 56 faces: zero text/text overlaps, zero unrelated text/ring overlaps, zero compile issues, zero renderer issues and zero browser errors. All 56 output rows explicitly remain held. The first ring collision count included each marker's own letter; the audit now excludes only that intentional ring/glyph pairing and still checks every unrelated text element. That correction is documented in the script and the passing replay.

Inspected the complete default front and back outputs plus 2× detail crops for both markers and the POM schedule. The full-front capture confirms the current collar-over-plackets display and retained notices; the detail captures show readable W/D markers and complete keyed value/tolerance rows. Output can be zoomed as vector artwork; no callout layout or acceptance conclusion relies on the fit-to-page screenshot alone. No new callout collision or decision request was found. S417 neckline/collar contacts in all 28 Woven fronts, S381 continuous sleeve-hem crossings in all 28 backs, and all 34 Polo holds (including the fixed 0.68 cm residual vs 0.25 cm gate) remain unchanged.

### Verification and durable exit

- `node docs/research/epic17/S429-woven-pom-output-readability/audit-woven-callouts.mjs` — pass: 28 options / 56 faces; exact ten-source-POM inventory; all represented callouts and keyed markers bound to expected same-revision entities; expected table-only/not-represented rows; 223 callout instances; zero text or unrelated marker collisions and zero renderer/browser issues.
- Actual Chromium full output and zoom crops reviewed and retained under `rendered/` and `rendered-detail/`.
- No production code changed; no changed-code coverage or full repository gate is applicable to this audit-only slice. Control Center tests, board schema/read validation, packet/board replay, and `git diff --check` are required before commit.
- Holds and gates remain: 56 accepted / 90 held across 73 configurations / 146 faces; all 56 Woven and 34 Polo faces held; all-seven recipe acceptance; legacy DXF/protected export identities; V02-before-V03; CAD rights and representative round-trip gates; no physical-fit/factory/production-readiness claim.
- Implementation/audit authoring: approximately 2 minutes; focused replay and rendered review: approximately 7 minutes; external-agent wait: 0; blocking maintainer-decision wait: 0. No implementation depended on the just-confirmed recommendation set.
- Board start/exit moved revision 2529→2538 through the validated command layer. The packet, matrix, full-front output, D-marker crop and keyed schedule crop are linked to V02; exit evidence is linked to EPIC-17. Start/exit preflight and replay preserve all statuses and all current holds. `npm run control-center:test` passes 42/42; `readBoardFile()` verifies revision 2538; every S429 script passes `node --check`; `git diff --check` passes.

**Next action:** begin a fresh-numbered slice from this boundary against the remaining repeated G04 blockers; preserve the Woven continuous neckline and source-continuous sleeve hems, the Polo cap-POM and 0.25 cm residual decision, and all current holds unless new pattern-specific evidence supports a truthful view mapping.
