# EPIC-17 / G04 V03 — CLO native size-group probe — Slice 564 exit

## Result

This practical test does **not** pass the source-backed size/grade or round-trip
gate. CLO 2026.1.310 accepted DXF-ASTM / Graded Nest with grading enabled and
emitted two group-specific DXFs: front/back under `Skirt Source 5-Size`, and
waistband under `Size Group 1`. Combined, their block names cover roles 0–2
for XS/S/M/L/XL. Labels alone were correct, but source contours expose a real
geometry failure. Against the unchanged 0.001 cm gate, the combined files
match all six XS CUT/SEW contours (maximum residual 0.000015 cm). For each of
S/M/L/XL, only one of six contours passes; the other five fail, with maximum
residuals of 2, 4, 6, and 8 cm respectively. In particular, the waistband
cut width is 44.5 cm in every exported size while the source widths are 44.5,
46.5, 48.5, 50.5, and 52.5 cm. The native-group UI showed 20 mm X offsets per
size step for selected waistband corners, yet those changes were absent from
the exported XS-to-XL geometry. That discrepancy must be diagnosed before
another grade export is treated as meaningful.

The XS base contours survive within tolerance. The non-base block names do
not carry the corresponding source geometry. This is a measured receiver
workflow/configuration failure, not an inference that CLO cannot process a
correctly authored graded file. It remains unresolved whether the cause is
point assignment, size-group membership, grade-value persistence, or a
receiver/export limitation.

The waistband DXF was reopened in CLO with Load Type Open, DXF-ASTM,
centimeters, 100%, and Do Not Rotate. CLO displayed a notice that seam
allowances were absent and the outlines had been imported in Custom mode to
preserve shape. The rendered result shows one coincident waistband outline;
no separated XS/S/M/L/XL geometry is visible. This open is not a five-size
round-trip pass. A CLO 2D snapshot of that re-import is retained in the
C:-only S564 folder.

## Evidence and exact settings

- The five S559 per-size Skirt source fixtures and S562 source-point map were
  the only geometry/grade references. No grade rule was guessed.
- Both exports used DXF-ASTM, Graded Nest, centimeters, 100%, Do Not Rotate;
  grading, baselines, and seam allowance export were enabled; curve
  conversion/optimization were off; duplicate notch on seam allowance was
  on. The export groups were selected separately in CLO's export dialog.
- Front/back DXF: `s564-source-group-front-back.dxf`, 30,464 bytes,
  SHA-256 `6ec3d3cb982547e0bfda5f33452717fa8543a183c8dc50c060f712433ad471a7`.
- Waistband DXF: `s564-waistband-sizegroup1.dxf`, 13,890 bytes,
  SHA-256 `ca71db1b9acd8e2ff20095f0abe68c3000536b84f44d74093731e118ed6c5289`.
- Combined report: `s564-combined-groups-analysis.json`, SHA-256
  `56217635bfab109484e2fa4e70da696373672b3bf2470ddd589b50020032d6a9`.
- Rendered re-import: `s564-clo-reimport-waistband-overlay.png`, SHA-256
  `70c952664c82f23ab266e6cefe33e5bf1d009982213e2ac4d33c73c297bfc549`.
- Exchange files and the rendered snapshot are only in
  `C:\G04-CLO-DXF-Exchange\S564-clo-native-size-group-probe`.
- The reproducible analyzer accepts multiple emitted group files, preserves
  missing/non-finite contour failures explicitly, and compares all source
  CUT/SEW contours at the unchanged threshold:
  `analyze-s564-clo-graded-nest.mjs`.

## Gate disposition and boundaries

| Gate | S564 disposition |
|---|---|
| CLO opens and emits DXF-ASTM / Graded Nest | **Observed pass, narrow:** two separate named groups export readable DXF block/insert records. |
| Exact source geometry by size | **Fail:** 6/6 XS pass; 1/6 contours pass for each S/M/L/XL; maximum residuals are 2/4/6/8 cm. |
| Five-size import/render identity | **Fail for this pair of exports:** the waistband re-import renders one coincident outline and reports missing seam allowance/Custom mode; no five-size visual identity is established. |
| Exact industrial profile edition/conformance and independent receiver acceptance | **Still held:** CLO UI acceptance and DXF-ASTM labeling do not establish normative or cross-receiver compatibility. |
| All-seven recipes, options, grade/marks semantics, negative fixtures, rights/profile, export identity | **Unchanged/held.** |

No product source, production code, cut geometry, legacy DXF behavior, protected
export identity, V03 threshold, or G04 acceptance criterion changed. No
physical-fit, factory-acceptance, or production-readiness claim is made. CLO
remains open because admitted exchange work is unfinished.

## Verification, board, and time

- `node --check analyze-s564-clo-graded-nest.mjs` passed.
- Focused analyzer replay passed structurally and produced the mismatch counts
  above from the actual CLO files. The rendered PNG was visually inspected.
- `git diff --check` passed before durable closeout. No production code or tests
  changed; no repository-wide coverage gate was due. Board closeout commands
  are preflighted and replayed through the validated Control Center command
  layer; focused Control Center tests run for the board update.
- Started 2026-10-09 00:58:51 UTC at S563 `3a2a06b`, board revision 3369;
  S564 start replay advanced the board to 3371. Exit at approximately
  2026-10-09 02:50 UTC; elapsed approximately 1h51m. Approximate work split:
  source/CLO setup and point inspection 1h29m; export/import and rendered
  review 12m; focused comparison/checks 5m; durable closeout 5m; external-agent
  waits 0m; maintainer-decision time 0m.

## Next action

Reserve S565 after refreshing origin/history and the board. Inspect the saved
CLO trial project and the exact selected grading points, group membership, and
per-size application state against the S562 point map. Find why the visible
20 mm step offsets do not change the emitted size contours. Change nothing in
product source or gates; rerun a corrected practical export only after the
cause and point-to-piece assignments are directly established. Keep V03 open.
