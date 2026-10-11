# EPIC-17 / G04 V03 — S720 CLO draw-curve-points exit

## Result

S720 completed the single authorized same-source off/on test of CLO 2026.1.310's **Import Draw Curve Points** setting in the DXF-ASTM route. This setting did not change any measured outline geometry and does not clear any V03 receiver gate. Do not repeat the setting or use the result as a standards claim.

## Test identity and exact controls

- Input: `C:\G04-CAD-Interchange\S720-clo-draw-curve-points\Input\polo-m-buttonhole-cross.dxf`, copied byte-for-byte from S708 current-source Polo M; SHA-256 `734E8902D798D0D6FD4F911AF0902FF4C8EE1503B45BE3AABB6F649438FAE1DF`; 285,209 bytes; `$INSUNITS=5` (centimeters); 18 closed POLYLINE outlines / 4,829 vertices; no ARC/SPLINE/LWPOLYLINE outline entities.
- Both imports used CLO 2026.1.310 (r58944), **DXF-ASTM**, centimeters, 100%, no rotation, original grain retained; pattern annotation/auto-trace/swap cutting-sewing/autodistribute/optimize/remove non-grading points off; notch import to both with ratio. The only changed import setting was **Import Draw Curve Points**: unchecked for control, checked for candidate.
- Both exports used DXF-ASTM, centimeters, 100%, no rotation, export without grading; baselines and seam allowance retained; duplicate notch on seam allowance checked; convert curve points to straight points, optimize all curve points and bounding box off.
- CLO displayed the expected nine pieces in both cells without an import warning or error. I inspected the actual 2D Pattern Window after the candidate import: nine front/back/body/closure/collar pieces were visible, with no missing piece or obvious blank-render issue. The saved `.zprj` files preserve both sessions for reopening. This is visual inspection of the imported source in CLO, not physical validation or a claim that the returned file was reopened in another receiver.

## Output evidence (all exchange files stayed on C:)

- Control return: `C:\G04-CAD-Interchange\S720-clo-draw-curve-points\Output\S720-off-control.dxf`, 1,561,412 bytes, SHA-256 `69C7FF2958BE0D81E34E6481BA219F43EE70D21C2C9689E04518B445210B09B7`; project `Projects\S720-off-control.zprj` (2,778,402 bytes).
- Candidate return: `C:\G04-CAD-Interchange\S720-clo-draw-curve-points\Output\S720-on-candidate.dxf`, 1,561,413 bytes, SHA-256 `ED2C024352120166D754DF908A878B55F0B0ABD50657D6EB4A06D053C3E150FC`; project `Projects\S720-on-candidate.zprj` (2,779,735 bytes).
- Machine comparison: `Evidence\S720-comparison.json`; both detailed measurements: `Evidence\S720-off-control-measurement.json` and `Evidence\S720-on-candidate-measurement.json`; block/entity audit: `Evidence\S720-block-audit.json`. Measurement result arrays are identical (ignoring the expected return-file hash field). Both returns contain nine block definitions and nine INSERT plus nine TEXT model-space records on numeric layer `1`, and neither declares `$INSUNITS`.
- Candidate measured under the fixed `0.001 cm` symmetric-contour gate: all nine SEW contours and four of nine CUT contours pass. Five CUT contours fail and match the control exactly: back `0.0025785809 cm`; outerStand `0.0329337961 cm`; innerStand `0.0329350687 cm`; upperCollar `0.0108510435 cm`; underCollar `0.0108510683 cm`. Returned CUT candidates are on numeric layers `8`/`1`, not semantic `CUT`; the block audit also shows numeric layers and does not establish source-identifiable marks/grainlines. The source unit declaration is absent from both returns. These are unchanged, previously observed CLO route failures, not new acceptance thresholds.

## Acceptance, scope and holds

- **Cleared by S720:** only that the option can be exercised through the installed receiver UI; both cells imported/rendered nine pieces without an error dialog. This is not a V03 gate pass.
- **Failed / not cleared:** CLO's fixed geometry gate (five CUT failures), returned units, semantic layers/marks, and exact industrial apparel receiver/profile qualification. Piece names retain the known `_M` suffix; S720 does not override S711 identity/mark evidence. No all-seven/options/grades exchange, malformed-receiver behavior, repeatability, or returned-output readability gate was attempted.
- All-seven recipes/options/grades, fixed thresholds, profile/rights requirements, legacy DXF behavior and protected export byte identities remain unchanged. V01/V02 remain Done; V03 and EPIC-17 remain In Progress; the goal remains active. No code, pattern geometry, source stitch graph, baseline, or acceptance criteria changed. No ANSI/AAMA/ASTM conformance, physical-fit, factory-acceptance, or production-readiness claim.

## Verification, closeout and timing

- Start: 2026-10-11 04:15:21 UTC at `fc3504649ac5871e5019896cc6c989e4b445eede`, branch `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Slice 720 is unique after S719.
- Focused evidence check: exact hash-pinned input, off/on reports compared recursively, DXF unit/model-space/block counts inspected; saved candidate projects verified. `npm run control-center:test` and `git diff --check` run for the validated board closeout. No production code changed; changed-code coverage and the full repository gate do not apply to this evidence-only slice.
- Time from start to closeout: 17m. Receiver interaction and capture: about 12m; focused file/report review: about 3m; external-agent wait: 0m; maintainer decision time: 0m. (The user selected the uniquely listed CLO workspace; no further UI action was needed.)
- The two pre-existing untracked S700 coverage diagnostic files are preserved and were not altered.

## Next action

Continue from S719's fixed gate matrix and stop-churn plan. S720 rules out this CLO setting as a geometry fix. Do not repeat CLO, DGS, LibreCAD, OpenCAD, another file encoding, or a sibling setting. Select the next implementation task only when repository evidence identifies a specific source-side behavior that advances a fixed V03 gate without disguising receiver data loss; any candidate must still clear its independent route/profile and rights gate before breadth testing. Preserve final full coverage/build/browser/Electron/output review, the end-only unnecessary-file cleanup, reviewed PR, safe merge, refreshed `origin/main` ancestry, required deployment and production end-to-end verification.