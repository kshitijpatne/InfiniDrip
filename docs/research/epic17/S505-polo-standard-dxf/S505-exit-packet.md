# EPIC-17 / G04 V03 — Slice 505 CLO Standard DXF Polo probe

## Result

**Failed as an exchange candidate; all G04 acceptance gates remain unchanged.**
After an initial ambiguous CLO window enumeration, a later fresh enumeration
provided one uniquely targetable CLO 2026.1.310 (r58944) window. The authorized
Polo M Standard DXF import, rendered inspection, ASTM export, reimport, and
second ASTM export were completed. CLO displayed the nine pattern pieces and
reported no fatal import error. Its seam-allowance notice said those paths
were imported in Custom mode to preserve shape.

This visible successful import/render is not a passing exchange result. The
first export has the nine piece blocks but all nine output CUT bounding boxes
are one tenth of the source dimensions under centimeter interpretation. For
example, the source front is 28.50 × 73.274 cm; the corresponding output is
2.850001 × 7.3274 cm. All nine piece width/height ratios are approximately
0.1. The unchanged geometry gate is `0.001 cm`; this is a clear failure. CLO's
Standard DXF route is not selected as an accepted G04 profile.

The shape-normalized diagnostic pass (scaling only its comparison reference by
0.1; never the fixture or acceptance gate) still finds the five known CUT
contour deviations: back, outer and inner collar stands, and upper and under
collars. Estimated sampled distances are `0.018628–0.023352 cm`; this is
diagnostic evidence, while the unscaled dimensional loss independently fails
the gate. The earlier S503 CLO ASTM/Optimize-off output retains source-scale
bounds (front 28.50 × 73.274 cm) but has the same five known contour failures
with exact-segment sampled lower bounds `0.012736–0.013974 cm`. Standard DXF
therefore does not repair those contour losses and adds a scale failure.

The actual second round trip retained 94/100 first-export polyline records.
The 94 matched records differ by at most `0.0000022361 cm` at corresponding
vertices. Six records are absent: three distinct closed four-vertex shapes in
block `3_M`, each present once on numeric layers `8` and `85`. Their bounds
are recorded in the comparison JSON. Numeric layer semantics are not inferred;
the evidence establishes missing geometry records, not that these are
buttons or a specific manufacturing mark.

## Configuration and files

The complete fixture, projects, exports, screenshots, and diagnostic reports
are confined to `C:\\G04-CLO-DXF-Exchange\\S505-polo-standard-dxf`.

- Input `Input\\polo-standard-m.dxf`: 24,261 bytes, SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- Import: Standard DXF; centimeter; 100%; Do Not Rotate; Maintain Original
  grain; Import Notches Both / Ratio; Optimize All Curve Points off. Other
  visible toggles were off.
- First export: DXF-ASTM; Graded Nest; centimeter/100%; Do Not Rotate;
  Duplicate Notch on Seam Allowance on; Optimize All Curve Points off.
- First output: 199,022 bytes, SHA-256
  `209f34f6ccaae8a4b7d64f11affc7c4766dad934e00b9c893f021bb3b4bbe260`.
- Reimport: DXF-ASTM; centimeter/100%; Do Not Rotate; Maintain Original grain;
  notches Both / Ratio; Optimize All Curve Points off. CLO displayed the
  Custom seam-allowance information notice; it was acknowledged without
  suppressing future notices.
- Second export used the same ASTM export settings: 196,692 bytes, SHA-256
  `56496cac37d17a8f2aebe184fc94e1d8b18a3560144c83e6d6ea76fa22b0ec25`.
- Saved CLO projects: `Projects\\s505-standard-dxf-import-export-probe.zprj`
  (2,243,208 bytes) and
  `Projects\\s505-standard-dxf-roundtrip-reimport.zprj` (2,243,822 bytes).
- Actual import/render/export and round-trip screenshots are in `Evidence\\`.
  The replay analyzer and the exact missing-record/vertex-drift report are in
  `Evidence\\Analysis\\`; these are C-drive evidence files, not repository
  production code.

The visual workspace showed all nine pieces after each import. This confirms
renderability only. The byte identities, live renders, numeric bounds, and
record comparison provide the exchange findings above.

## Gates and limits

- **Failed:** source-scale geometry in Standard DXF import/export and the
  round-trip record-preservation check. The `0.001 cm` tolerance is unchanged.
- **Still failed:** the five Polo CUT contour witnesses from S503; changing to
  Standard DXF did not resolve them.
- **Still open:** rights and local-handling basis, exact industrial apparel-CAD
  profile/conformance, actual native grade semantics, negative-control
  rejection/reporting, representative fixtures across supported complexity,
  and all-seven receiver evidence. CLO is not selected as the V03 receiver or
  claimed as a compatible industrial profile.
- **Unchanged:** V02-before-V03 dependency (V02 Done), all-seven criteria,
  legacy DXF behavior, protected export byte identities, and all other V03
  gates. No garment source, production code, fixture, output baseline, or
  acceptance criterion changed.
- No cloud upload was used. No physical-fit, factory-acceptance, commercial
  conformance, or production-readiness claim is made.

CLO was closed normally after capture and comparison; the final window
inventory contained no CLO window. All test files remain in the named C: folder
as requested.

## Verification, boundary, and next action

The S503 analyzer was replayed on the hash-pinned S505 input; a separate
comparison matched 94 output polylines at a `0.001 cm` corresponding-vertex
limit and enumerated all six losses. Direct dimension comparison used the
S503 ASTM report's original source bounds and S505's actual output bounds. The
existing ASTM baseline and S505 Standard result were compared under the same
Polo M source revision and centimeter interpretation. Closeout verification:

- C-only source and output hashes and saved CLO projects verified; live
  settings and rendered outputs were captured.
- `standard-import-roundtrip-diff.json` matches 94/100 records, lists 6
  unmatched records and measures maximum matched vertex displacement at
  `0.0000022361 cm`.
- `s505-direct-source-scale-comparison.json` reports all nine width/height
  ratios at approximately `0.1`.
- Exit command preflight passed at expected revision 3135; validated command
  replay advanced the canonical board `3133→3135`, retained V03 In Progress,
  and linked `E-G04-S505-EXIT`.
- `npm run control-center:test` passed 42/42. Command-helper syntax checks
  passed. The unstaged `git diff --check` passed; staged check is recorded
  after staging below.

S505 started `2026-10-08 15:46:12 UTC` from S504
`1111b9e2504fac3e400d5a4c1da8252627b2f712` and closed
`2026-10-08 16:17:10 UTC` (30m58s) on `codex/epic-17-g04`. Refreshed
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
The S504 boundary review found the EPIC goal Active and still
needed through merge and deployment; the record was not changed or resumed.
Board start was `3132→3133`; exit replay is `3133→3135`. Unique slice number:
S505. Elapsed categories: implementation `0m`; focused UI/geometry
verification `~23m`; durable packet, board replay and focused checks `~7m58s`;
external-agent waits `0m`; maintainer-decision time `0m` (approximately 30m58s
total).

**Next:** refresh Git and board state, then reserve S506. First reconcile
the specific receiver-rights/local-handling/profile prerequisite using
already reviewed candidate evidence, without another CLO pattern trial absent
rights evidence. Keep all V03 gates and claims unchanged while that prerequisite
is unresolved.
