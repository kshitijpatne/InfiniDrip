# EPIC-17 / G04 V03 — S715 source-side cut contour diagnosis exit

## Finding

The exact S714 source/return point report shows CLO’s saved output reuses source points and omits others: every returned vertex is within 0.000038 cm of a source vertex. For the five failing CUT paths, CLO's return has fewer vertices: back 448→341, both stands 751→413, and both collars 763→422. The key omitted shallow corner on each path exceeds the fixed 0.001 cm limit. This points to point removal in the tested CLO conversion path; the saved files alone do not tell whether the omission occurs during import, save, or export.

This does not demonstrate a source-writer defect. The interchange writer emits the points at six-decimal precision; existing S699 evidence measures source serialization error below 0.000001 cm. Prior S503 ran the exact Optimize All Curve Points control both off and on in four AAMA/ASTM combinations; it changed separate button loops but did not improve the same five CUT contours. S536's R2000/LWPOLYLINE version, S545/S551 units runs, S553 Standard-vs-AAMA output, S640 connected-LINE input, S671/S672 density evidence, and S613 exact omitted-corner mapping already address the plausible format, precision, unit, mode, density, and short-feature hypotheses. S555's source/standards review concluded no evidence-backed geometry-preserving fix or new same-fixture trial was justified. S714 confirms the same five losses on the exact current S711 source/return pair.

CLO's official [2D Pattern DXF Import/Export guide](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export) describes Optimize All Curve Points as optimizing the number of curve points. That is exactly why S503's completed on/off comparison is controlling; it does not provide a reason to rerun a settled setting. No new CAD application, format, setting, encoding, source geometry, or acceptance variation was used in S715.

## Decision and gate status

- No code-side correction is supported by current evidence. Do not alter the CUT contours to fit CLO's returned approximation, and do not try another point-order, density, or entity-encoding guess.
- The current CLO DXF-ASTM empirical route remains **failed** on the five CUT contours and on previously measured unit and source-identifiable mark/layer gates. It is not qualified for G04 V03. No ANSI/AAMA/ASTM conformance claim is made.
- The goal remains active, and G04-V03 remains In Progress. All seven recipes/options/grades, rights-reviewed documented profile, repeatability, malformed-input UI, readable output, final coverage/build/browser/Electron/rendered review, necessary-file cleanup, PR, safe merge, ancestry, deployment and production E2E remain required.

## Evidence and verification

- S714 actual source/return hashes and contour table: `docs/research/epic17/S714-s711-source-return-measurement/S714-exit-packet.md`.
- Detailed source-point retention report: `C:\G04-CAD-Interchange\S715-source-cut-contour-cause\S715-point-retention.json`; analysis script is in the same named C: folder.
- Prior controlling packets: S503 import-optimizer matrix; S536 R2000/LWPOLYLINE; S555 remediation analysis; S613 omitted-corner adjacency; S699 source/return loss audit; S700 enabled Draw Curve Points; S714 exact S711 comparison.
- Product implementation and pattern geometry unchanged. The evidence report parses nine pieces; all returned CUT vertices map within 0.0001 cm of source vertices. The focused report assertion passed; `npm run control-center:test` passed 42/42 and `git diff --check` passed. No full repository gate was run for this diagnostic-only slice.
- Start: 2026-10-11 03:12 UTC after S714 commit `d9fdb3f9cde665dd27ea7f2e8e9f88b0d1461412`; `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; starting board revision 4187. Close: 2026-10-11 03:17 UTC, about 5m: implementation 0m; current point-loss comparison and prior-evidence reconciliation 2m30s; durable closeout and focused verification 2m30s; external waits 0m; maintainer-decision time 0m.

## Next action

Continue on the independent V03 negative-input requirement with a narrow, local, product-visible returned-DXF validation flow built on the existing fail-closed auditor. Keep every geometry/profile gate unchanged; this work cannot make the failed CLO route pass. Do not expand into a broad UI redesign.

