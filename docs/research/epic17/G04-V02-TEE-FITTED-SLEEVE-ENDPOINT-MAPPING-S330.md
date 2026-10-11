# G04 V02 — Tee/Fitted sleeve endpoint mapping — Slice 330

## Start record and verified boundary

- **Started:** 2026-10-01 08:46:39 UTC.
- **Goal:** continue admitted EPIC-17/G04 through seven-recipe V02 acceptance, V03 industrial CAD exchange proof, reviewed PR, safe merge and any required deployment. This slice owns only the Tee/Fitted body-relative sleeve edge-to-armhole endpoint mapping that remained unresolved at S329.
- **Git:** branch `codex/epic-17-g04`, clean at S329 commit `3594160a3101c51c648cd10bdc7ffc26ac488302` (`Slice 329: hold invalid Tee and Fitted sleeve transforms`). Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 329; reserve S330.
- **Board:** canonical revision 936; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Settled production matrix remains 73 configurations / 146 faces / 32 option fields, 52 accepted / 94 held. All four Tee/Fitted defaults remain held; Polo 34 and Woven 56 remain held.
- **Upstream:** EPIC-14/G01, EPIC-15/G02 and EPIC-16/G03 remain closed and merged per the admission packet and canonical board.
- **Usage:** primary window 16% used; ordinary usage allowed; weekly meter informational.
- **Authority:** `docs/planning/EPIC-17-ADMISSION.md`, G04 roadmap acceptance, maintainer view decisions in `docs/PROJECT-DECISIONS.md`, S321/S322 Tee/Fitted view mapping, and S329's manually rejected production candidate.

## Problem and source evidence

S329 established these directly encoded facts:

- `src/drafting/sleeve.ts` creates `capLeft` from left underarm to crown and `sideLeft` from left hem to the same left underarm. `capRight` runs from the crown to right underarm and `sideRight` from right underarm to right hem.
- `src/drafting/bodice.ts` creates each Tee/Fitted `armhole` from shoulder to underarm. `src/drafting/tshirt-checks.ts` orders the `Sleeve-cap ease` interfaces as `[sleeve.capLeft, sleeve.capRight]` against `[front.armhole, back.armhole]` with encoded ease `[-1, 4]` cm.
- On S329's production FRONT_FLAT candidate, the path for the approved `sideLeft` interval begins at the rendered shoulder/crown station and proceeds inward across the bodice. The source join `capLeft.start == sideLeft.end` is not preserved at the displayed underarm. The normal S329 attempt emitted four faces but failed visual acceptance. A separate back-reflection candidate separated the sleeve from the body when it omitted a compensating placement transform. Both candidates remain diagnostic only; see the S329 exit packet and its three reviewed output folders.
- Default total cap ease is 1.5 cm; the solver still reports a 0.48 cm endpoint residual after rigid placement. S322 changed measurements produce a 6.402469 cm cap/armhole difference against a 4 cm encoded maximum. That separate measurement fixture remains held and cannot be hidden by clamping.

The maintainer-approved view convention remains front `capLeft` + `sideLeft` + left hem half, back `capRight` + `sideRight` + right hem half, and two mirrored instances without a visible partition. It authorizes view metadata only. Do not reinterpret the selected source half, add a seam, change cut geometry, change physical multiplicity, or alter the stitch graph.

## Scope and acceptance

1. Trace each exact Tee/Fitted source run through projection landmark resolution, assembly transform, face pairing/reflection, colorway area closure, and SVG serialization. Identify the exact function where the source-underarm endpoint ceases to map to the body armhole underarm. Label source facts, prior approved view decisions, and new transform conventions distinctly.
2. If the error is a renderer/projection defect, implement only the source-backed view correction. Preserve the input pattern and stitch graph byte-for-byte. Do not bypass the source assembly or ease checks, clamp lengths, or force an unsupported affine scale.
3. Add tests for exact source endpoint correspondence, source immutability, face-specific edge role and reflection, and fail-closed behavior for missing/malformed topology. Changed production modules must reach 100% statement, branch, function and line coverage.
4. First run a focused strict production Chromium replay for Tee/Fitted defaults (four faces). Manually inspect contour continuity, body-relative sleeve exterior, overlap/crossings, doubled strokes, hidden view partition, color-area ownership, readable labels and same-revision POM anchors. Any failed face remains held.
5. Only after strict visual review passes, run the full 73-configuration / 146-face / 32-field production matrix and compare all per-face outcomes with S329. No previously accepted face may regress. The 90 non-Tee/Fitted holds retain exact reasons. Keep the four S322 measurement faces held unless their exact supported placement passes without clamping; record their separate scope status.
6. Run focused tests/coverage, build, protected export/DXF/byte-identity checks if production output code changes, validated Control Center regression after exit commands, and `git diff --check`. Full repository tests and global 100% coverage remain once on the settled integrated Epic/PR candidate.
7. At exit, record exact commit, rendered evidence and pass/hold state, current estimate, MQF applicability, separate implementation/focused verification/output/record/agent-wait/maintainer-decision time, and one gated next action. Preserve V02 In Progress / V03 Backlog unless full accepted criteria are met.

## Non-goals, holds and risks

- No pattern geometry, piece identity/multiplicity, stitch interface, ease rule, or physical garment construction changes.
- No physical sampling, fit claim, factory acceptance or production-readiness claim.
- No Polo, Woven, Trouser, Tank, Skirt, G05 tech-pack, G09/D04 assembled-view, broad UI, DXF behavior or export-baseline scope.
- Preserve all-seven V02 acceptance. V03 remains gated on full V02 acceptance and separate rights/receiver evidence.
- MQF-005–007 stay `To be reviewed` at applicable G04 output exits; MQF-004 remains Woven-specific, MQF-011 retains post-G17 deferral, MQF-012 is Polo-specific, and MQF-015 is V03-gated. Findings are review checks, not scope expansion.
- **Risk:** the 0.48 cm default endpoint residual is within the encoded allowance but does not define its physical easing distribution. Preserve the notice and do not fabricate a stitch shape. The visual mapping can only claim a source-to-view projection, not a sewn-fit result.

## Dependencies, delegation and estimate

- Depends on approved S321/S322 Tee/Fitted view decisions and the exact S329 source/render trace.
- Shared projection, assembly and live SVG renderer logic is coupled across garment roles and faces. No safe disjoint low-risk implementation task exists; Codex retains ownership and integration. No external coding-agent work is started.
- **Lower bound at start:** at least 10 more landed slices / 79 total from S329: this transform resolution, integrated V02 exit, V03 five-slice minimum after V02, and three final integration/PR/merge/deployment slices. Remaining recipe holds, rights review, receiver selection and output failures may increase this without a defensible upper bound.

## Exit evidence to record

- Reproducible source-to-view trace locating the endpoint mismatch and its correction or the precise remaining blocker.
- Strict four-face current-production outputs and manual geometry review; full option-matrix replay only if strict review passes.
- Focused tests/100% changed-module coverage, build and protected output gates as applicable; board revision/evidence and MQF review disposition.
- Exact landed commit, acceptance/hold status, estimate and elapsed-time breakdown; no claims beyond digital rendered evidence.

## Verified exit — 2026-10-01

- **Implementation:** The projection map now carries an exact front-only reversed traversal for `front.armhole` on the `Sleeve-cap ease` relation, derived from source endpoint order: `sleeve.capLeft.start == sleeve.sideLeft.end` is the sleeve underarm, while `front.armhole.end` is the bodice underarm. The source stitch graph remains unchanged. The rigid view placement corrects only translation to place that underarm exactly; rotation and curve shape are preserved, with no scale or easing redistribution.
- **Back orientation:** The selected `capRight` / `sideRight` source edges did not project to the exterior side under their raw local orientation. The admitted projection map now records a local-Y view reflection, validated against exact `capLeft.end == capRight.start` and `capRight.end == sideRight.start` source joins and the already-approved S321 view convention. This is a view convention, not a directly encoded physical construction fact. The approved paired display reflection then produces two sleeve instances. Pattern piece data, stitch graph, edge identity, multiplicity, and cut geometry remain unchanged.
- **Ease:** All four default Tee/Fitted faces anchor the selected sleeve underarm exactly to the body armhole underarm. Their remaining cap endpoint residual is 0.68 cm after the rigid fit and remains a visible same-revision construction notice. No scale, clamp, stitch edit, or physical-fit claim was introduced.
- **Strict production review:** rebuilt Chromium emitted all four defaults, each with two exterior sleeve instances, continuous selected cap/side/hem contour joins, no body-interior crossing, no visible view-partition stroke, visible sleeve colorway closure, same-revision body POM geometry, labels within the viewBox, zero label overlaps, and zero browser/page/request errors. Manual dispositions are in `docs/research/epic17/S330-tee-fitted-browser/manual-review.md` with current captures and SVGs.
- **S322 measurement hold:** the production UI replayed the recorded changed-measurement Tee/Fitted drafts at their exact revision values. All four front/back requests are completely withheld with the length-incompatible `Sleeve-cap ease` issue, no partial SVG, and zero browser/page/request errors. Evidence and reproducible replay are in `docs/research/epic17/S330-tee-fitted-browser/measurements/` and `replay-measurements.mjs`.
- **Integrated matrix:** final rebuilt production Chromium replay covers 73 configurations / 146 faces / 32 option fields. It accepts 56 and holds 90 with zero console, page, or request errors. Compared with S329, exactly the four Tee/Fitted defaults changed from held to accepted; all 52 prior acceptances remain and all other 90 issue strings are unchanged. Final per-face evidence and manual disposition are in `docs/research/epic17/S330-integrated-browser/`.
- **Focused gates:** projection, assembly, live-view and SVG suites pass 92/92; the three changed production modules each pass 100% statement, branch, function and line coverage. `npm run build` passes with the existing Vite chunk-size advisory. Protected export and byte-identity suites pass 23/23. The regenerated option and changed-measurement Chromium replays pass their output assertions. Control Center tests after validated exit commands and `git diff --check` remain the final local closeout gates.
- **Manual-quality review:** MQF-005–007 are partially represented by contextual source geometry, exact body POM anchors, visible ease notice and collision-free labels; missing sleeve-specific POM anchors, pattern-key placement, and direct block annotations remain open. MQF-004 remains Woven-specific and held. MQF-011 remains a partial colorway/artwork-view overlap; deeper selection and interaction work retains its post-G17 deferral. MQF-012 remains Polo-specific and held. MQF-015 remains gated on V03. All remain `To be reviewed`; no finding creates work outside G04.
- **Scope and tally:** no pattern geometry, stitch relation, physical instance count, legacy DXF behavior or protected export byte identity changed. Current all-recipe state is 56 accepted / 90 held; seven-recipe V02 acceptance is unmet. G04-V02 remains In Progress and V03 remains Backlog. No physical sampling, fit, factory-acceptance, CAD-compatibility or production-readiness claim is made.
- **Estimate:** after S330, at least 9 additional landed slices / at least 339 total remain under the current minimum (integrated V02 exit, V03 five-slice minimum after V02, and three final integration/PR/merge/deployment slices). Existing recipe holds and V03 rights/receiver work may add unbounded time and slices.
- **Elapsed time:** approximately 48 minutes 46 seconds from 08:46:39–09:35:25 UTC: source/transform diagnosis and implementation 13m; focused tests, coverage, build and protected-output gates 10m; strict, measurement and integrated production replay plus visual review 15m; durable records, validated board, Control Center regression and commit closeout 10m46s; agent waits 0m; maintainer-decision time 0m.
- **Commit and board boundary:** one landed commit is reserved as `Slice 330: map Tee/Fitted sleeve endpoints`; refreshed `origin/main` remains `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and is an ancestor. Canonical board revision 961 links this report, all render/browser evidence, and current status to G04-V02, the EPIC-17 work card, and the Epic record. The first Control Center regression after refreshing the board surfaced stale S329 description assertions; those assertions now verify S330's estimate, output tally, and evidence refs, and the full 33-test Control Center suite passes. The exact commit hash is added to `PROJECT-STATE.md` after the commit is created.
- **Next action and gate:** admit the next unique slice from a refreshed Git/board/usage boundary to address the next explicitly held V02 source/colorway blocker. Do not begin V03 until all seven recipes satisfy V02 and its complete option/output acceptance.
