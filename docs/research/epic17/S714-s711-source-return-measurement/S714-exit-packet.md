# EPIC-17 / G04 V03 — S714 exit packet

## Result

S714 compared the exact S711 CLO return to its exact S708 source using the unchanged 0.001 cm limit. The comparison measures actual straight-segment polylines with symmetric point-to-segment distance; source and returned contours contain no bulge arcs. The contour findings are therefore not caused by the earlier coarse curve-chord concern.

| Piece | Source CUT vertices | Returned CUT vertices | CUT residual (cm) | SEW residual (cm) | Result |
|---|---:|---:|---:|---:|---|
| front | 531 | 380 | 0.000136844 | 0.000007998 | pass |
| back | 448 | 341 | 0.002578581 | 0.000014897 | CUT fails |
| sleeve | 489 | 488 | 0.000764000 | 0.000012369 | pass |
| buttonPlacket | 12 | 12 | 0.000008062 | 0.000008062 | pass |
| buttonholePlacket | 12 | 12 | 0.000008062 | 0.000008062 | pass |
| outerStand | 751 | 413 | 0.032933796 | 0.000023018 | CUT fails |
| innerStand | 751 | 413 | 0.032935069 | 0.000013494 | CUT fails |
| upperCollar | 763 | 422 | 0.010851044 | 0.000016537 | CUT fails |
| underCollar | 763 | 422 | 0.010851068 | 0.000022386 | CUT fails |

Thirteen of eighteen contours pass; all nine SEW paths pass; five of nine CUT paths fail. The failures are the back, both stands and both collars. In every failed piece, CLO returned fewer CUT vertices than the source. Numeric return layers contain repeated contour candidates, and the same measured residual recurs across those duplicate layers; the data cannot recover the original semantic CUT/SEW layer names. This proves the saved return changes those five CUT shapes, while not identifying why CLO changed them. It does not justify altering garment cut geometry or loosening the threshold.

The return has no centimeter unit declaration. Its nine source piece names and nine INSERT names each carry the selected-grade suffix `_M`, which S713 now normalizes exactly. It adds nine model-space TEXT labels. Piece entities use numeric layers rather than source semantic names. The three buttonhole crosses (six source lines) are not present as source-identifiable returned marks; the nearest returned point is 0.249992 cm from each source center, above the 0.001 cm gate. These unit, layer/mark and identity facts agree with the S711 report.

## Evidence and limits

- Source: `C:\G04-CAD-Interchange\S708-cut-layer-source-audit\polo-m-buttonhole-cross.dxf`, SHA-256 `734e8902d798d0d6fd4f911af0902ff4c8ee1503b45be3aabb6f649438fae1df`, source `$INSUNITS=5` (centimeters).
- Return: `C:\G04-CAD-Interchange\S711-clo-current-marks-check\polo-m-clo-astm-roundtrip.dxf`, SHA-256 `dca07b4b676a09c2643d21e1040941a6e316f405a9d3b82f97b614fca723f36d`; no `$INSUNITS`.
- Reproducible measurement report and scripts are in the approved external evidence folder: `C:\G04-CAD-Interchange\S714-s711-source-return-measurement\S714-curve-aware-measurement-v2.json`, `measure-curve-aware-v2.cjs`, and `inspect-layer-match.cjs`.
- This is one Polo M file, not an all-seven/options/grades, repeatability, malformed-input UI, readable-output or industrial-profile qualification.
- CLO’s “DXF-ASTM” menu label is not standards evidence. No ANSI/AAMA/ASTM claim is made. Rights/profile qualification remains separately unproven in repository evidence.
- No source code, source pattern geometry, acceptance criterion, fixed threshold, or CAD output was changed. No CAD application was rerun. No returned drawing was visually rendered in S714.

## Verification and time

- Focused source/return measurement: 9/9 pieces and 18/18 paths parsed; all returned polyline candidates carry zero bulges; source and return hashes match the retained S708/S711 artifacts.
- Per-layer comparison: six numeric returned layer names were inspected; duplicate contour candidates give the same residuals, so layer naming does not bias the contour result.
- Start: 2026-10-11 03:02 UTC after S713 `f43fbc9a979d6805dfedd62e4df6c405feea29d9`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- Close: 2026-10-11 03:11 UTC; elapsed about 9m30s: implementation 0m; source/return analysis 5m; focused report and board verification 1m; durable packet/state/board closeout 3m30s; external-agent waits 0m; maintainer-decision time 0m.
- `npm run control-center:test`: 42/42 passed, including canonical board validation. The S714 measurement report integrity/count/threshold assertion passed; `git diff --check` passed. No full repository gate was run for this evidence-only slice.
- S700 changed-coverage diagnostic files were already untracked before S714 and remain untouched for the required final cleanup inventory.

## Next action

S715 will inspect only the source-side CUT path construction for the five failing contours and measure which source points the saved return removed. It will test whether the current DXF interchange writer can emit a simpler but tolerance-equivalent path without modifying the pattern/stitch graph, legacy DXF, byte-identity baselines, or the 0.001 cm limit. Any candidate must pass source-geometry checks before one same-route CLO return is considered; no new CAD app, format, or setting is planned. Keep the all-seven/options/grades, rights/profile, repeatability, malformed-input UI and readable-output gates unchanged.

