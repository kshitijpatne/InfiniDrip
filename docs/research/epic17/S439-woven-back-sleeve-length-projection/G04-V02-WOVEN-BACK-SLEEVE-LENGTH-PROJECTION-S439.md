# G04 V02 — Woven source-length-preserving back-sleeve projection — Slice 439

## Start boundary and authority

- Started 2026-10-07 20:15:05 UTC from clean S438 `6fd18da82ff614d681db88cb9e75d6393e3e0070` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice at start was 438; S439 is unique. Board revision was 2622; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; tally 56 accepted / 90 held over 73 configurations / 146 faces. The admitted goal was active and still matched the objective through safe merge. Usage start: 22% primary / 18% weekly; ordinary work allowed.
- Start evidence was validated and replayed at 2622→2625. Control Center tests passed 42/42; statuses/tally unchanged.
- Exact source `src/drafting/shirt.ts::wovenSleeve`, S373 crossing trace and S406 production replay revision `live-draft:woven-shirt:14:14` govern this diagnostic. S438 already rejects masking because it erases both sleeve outlines.

## Scope and candidate mapping

Offline BACK_FLAT diagnostic only, all 28 options / 28 back faces. Keep the approved cap-to-armhole mapping and underarm station. Test a complete two-instance sleeve pair by solving the cuff-side station on the exact back torso outline, without a mask or a hem gap:

- Direct source facts: source `sideRight` runs `(width,capHeight)` to `(width−3,capHeight+sleeveLength)`. Standard M has sleeveLength 22 cm, so source side length is `sqrt(3²+22²) = 22.2036033112 cm`. Source sleeve width is `bicep 38 + ease 10/2 = 43 cm`; taper 3 cm gives full hem 37 cm and hem half 18.5 cm. The source stitch joins `sleeveBand.top` to the full `sleeve.hem`; cap edges join the front/yoke/back armhole roles. There is no source stitch from sleeve hem to body side, and no sleeve-to-sleeve join/order.
- Candidate rule: hold each back underarm U at `(27.5,24)` / its reflected counterpart; choose B on the first resolved same-revision back side-seam segment for which C=`B+(18.5,0)` is exactly 22.203603 cm from U. Reflect the left instance across `back.centerBack`. Keep cap geometry and all original source identity/joins. The 18.5 cm cuff half ends at the body-side contact; this is a view-only proposed convention, not a source stitch or physical join.
- The unique root is `back.sideMiddle`, `t=0.03046564`, B=`(23.6218626,40.7093128)`, C=`(42.1218626,40.7093128)` on the right; mirror x for the left. All 28 cases resolve to the same stations. The in-memory candidate preserves source lengths to floating-point precision; emitted production vectors independently confirm source lengths within 0.0002 cm, consistent with SVG coordinate rounding.
- Evidence class: lengths, edge endpoints, receiver topology and body side are directly encoded in source/current same-revision output. Root selection and the horizontal cuff/view pose are a proposed display decision. The contact at B has no stitch relation and may read as an incorrect assembly join.

## Exact rendered result — reject

The candidate is not viable and is rejected without production implementation:

1. **Detached-band collision:** every one of 28 cases has 12 segment crossings: both sleeve halves cross their approved full-scale detached-band outlines and fold marks (six intersections per side). This conflicts with the S370-approved `DETAIL ONLY—not at assembly location` band display. There is no remaining path through the fixed band footprint that yields this candidate's intended outward sleeve presentation.
2. **Unstitched contact:** both cuff-half endpoints touch `back.sideMiddle` in every case. Source topology contains no sleeve-hem/body-side stitch; this would visually imply an unsupported connection.
3. **Viewport clipping:** the output's existing horizontal viewBox is `[-32.2,32.2]`, while the candidate reaches `|x|=42.1219`, so the full candidate SVG clips sleeve tips in all 28 whole-view outputs. Detail crops expand the viewBox only for inspection and show the large triangular sleeve silhouette; they do not prove the candidate fits the production frame.

Chromium generated all 28 whole outputs and 28 enlarged detail crops with zero browser errors. Manually inspected default whole/detail, `yokeDepth-min/max`, `sleeveBandDepth-max`, and `sideVentDepth-min`; each confirms the band crossings, body-side cuff contact, and/or clipping. Option-matrix results, all candidate SVGs and images are retained under `source-length-candidate/`. The matrix records 28 unique length solutions, zero length residual failures, 28/28 unstitched body contacts, 28/28 band-collision rows, and 12 line intersections in each option.

This proves only that a simple source-length/side-contact solve is insufficient. Do not implement this mapping, move the bands, hide/clip sleeve strokes, add a hem gap, or release views on this evidence. All 56 Woven and 34 Polo faces remain held; 56 accepted / 90 held, all-seven V02 and V02-before-V03 stay unchanged. No source geometry/stitch graph, colorway, output renderer, option, export identity, CAD claim, fit, factory or production claim changed.

The maintainer's exact FG keyed POM presentation is already implemented and recorded at S434 and rechecked in S435/S436; this duplicate approval requires no additional Polo change. No current Polo marker/readability blocker is reopened.

## Verification and closeout

- Diagnostic script: `render-source-length-candidate.mjs`. It asserts exact S406 revision/28 options, pair identity, source-length recovery, unique roots, reflected instances, corresponding sleeve colorway boundary, 28-row results, and renders both crops per option.
- Result matrix: `source-length-candidate/S439-source-length-candidate-matrix.json`; exact output: 28 configurations, 28 unique roots, 0 length failures, 28 unstitched contacts, 28 rows with intersections, 28 band collision rows, 0 browser errors.
- Reviewed images: `source-length-candidate/rendered/woven-shirt-default-back_flat-source-length.png`, `.../woven-shirt-default-sleeve-detail.png`, yokeDepth min/max details, sleeveBandDepth max, sideVentDepth min. The full production-frame screenshot clips the overhanging sleeves; the enlarged crop exposes the candidate and collisions.
- `npm run control-center:test`: 42/42 passed; candidate script completed after adjusting its side-edge assertion to accept the two emitted body side runs in the `sideVentDepth-min` case; all 28 final assertions passed. `git diff --check` passes. No product code/test changed; no changed-code coverage or full-Epic gate is due.
- Board start/exit revisions: 2622→2625→2633. No statuses/tallies changed.
- Elapsed 20:15:05–20:25:25 UTC (~10m20s): product implementation 0m; source/mapping diagnosis ~2m; candidate script and focused assertions ~3m; Chromium rendering/manual review ~2m; durable packet/board/Control Center closeout ~3m20s; agent waits 0m; maintainer-decision time 0m.

## Next action

Preserve S370's approved fixed detached-band composition and all current Woven/Polo holds. At S440, test only a diagnostic source-vector-preserving sleeve orientation with the approved band detail footprint included as a hard collision constraint. If no outward, complete, un-clipped, readable solution exists without moving the approved band detail or implying a new stitch, stop and present that exact conflict and a bounded choice (approve a new detached-band layout convention for review, or retain the Woven hold); do not implement without approval. Do not reopen the continuous neckline decision. V03 remains behind all-seven V02.

