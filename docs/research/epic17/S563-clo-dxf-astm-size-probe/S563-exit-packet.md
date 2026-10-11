# EPIC-17 / G04 V03 — CLO DXF-ASTM size-group probe — Slice 563 exit

## Result

This practical CLO 2026.1.310 (r58944) trial does **not** clear the graded-size
interchange gate. It gives a concrete limitation for the tested path: five
separate ungraded Skirt DXFs were selected in the DXF-ASTM import dialog,
opened at centimeter/100%/no rotation, then exported as DXF-ASTM / Graded
Nest at centimeter/100%/no rotation. The output has three piece-role blocks
named `0_M`, `1_M`, and `2_M`. Against the unchanged 0.001 cm contour gate,
all six XS source contours match output geometry (maximum symmetric contour
residual `0.000017000000004727287 cm`); none of the six contours from S, M, L,
or XL matches output geometry within tolerance. Thus the source geometry that
survived is XS, while the output size suffix is M. The multi-file import did
not establish a five-size/grade group.

The emitted DXF was re-imported through the same CLO DXF-ASTM interface at
centimeter/100%/no rotation. CLO accepted it without a parse error and showed
the three Skirt piece roles. It displayed an informational seam-allowance
notice and stated the outlines were imported in Custom mode to preserve their
shape. This is a successful file-open/re-import observation, not a successful
five-size grade round trip or proof of normative ASTM conformance.

## Evidence and settings

- Source fixtures are S559 Skirt XS/S/M/L/XL, six closed contours per file.
  Exact file hashes and the parsed output geometry are in
  `C:\G04-CLO-DXF-Exchange\S563-clo-dxf-astm-size-probe\clo-size-probe-analysis.json`
  (SHA-256 `BC5FF2B4CF0728B08A6993B548E47FE7A5F0407D94B69E9C238332FAB806B99D`).
- Import: DXF-ASTM; Load Type Open; centimeters; 100%; Do Not Rotate; reset
  grain angle Maintain Original; notches Both at Ratio; import draw-curve
  points enabled; optimize curve points off; swap CUT/SEW off.
- Export: DXF-ASTM; Graded Nest; centimeters; 100%; Do Not Rotate; export
  without grading/base sizes/seam allowance off; duplicate notch on seam
  allowance on; curve-to-straight and optimize-all-curve-points off.
- Re-import: DXF-ASTM; centimeters; 100%; Do Not Rotate; import notches Both
  at Ratio and draw-curve points enabled.
- Export file: `skirt-five-size-astm-export.dxf`, 13,769 bytes, SHA-256
  `B5BC3E6EDC3D5D9A866745338F6E47013FF652BCB6CCF8803478D5D5324B3E27`.
- Rendered re-import: `astm-export-reimport-render.jpg`, SHA-256
  `9605EC17B89900D6BCAEA6C6A16BD347143FE93DBC0DCB431EAC2C2B5AB29BC0`.
- Imported project and pre-import safety copy are also retained in the same
  C:-only folder. No exchange file was placed outside that named folder.
- Reproducible analyzer: `analyze-clo-size-probe.mjs`; `node --check` and
  analyzer assertions passed. It writes the machine-readable report to C:.

## Gate disposition and boundaries

| Gate | S563 disposition |
|---|---|
| CLO local DXF-ASTM file acceptance | **Observed pass, narrow:** CLO opened and re-imported the emitted file; it displayed a Custom-mode seam-allowance notice. |
| Five-size identity and graded group | **Fail for the tested multi-file Open route:** all three output blocks say M; XS geometry alone matches all six source contours at 0.001 cm; S/M/L/XL each match 0/6. |
| Exact geometry | **Partial:** six XS source contours match to max `0.000017000000004727287 cm`; other source sizes do not match within the unchanged gate. |
| Normative DXF-ASTM profile/edition and industrial interoperability | **Still held:** the app's format label and successful open do not establish exact standard/profile conformance. |
| Other V03 gates | **Unchanged/held:** all-seven source-linked round trips, grade rules/options, CUT/SEW meaning, complete mark mapping, Polo's five contour losses, malformed-file behavior and applicable rights/profile gates remain. |

The trial only shows that importing these five independent one-size DXFs via
the selected `Open` route does not create the required graded set. It does not
prove that CLO cannot process a correctly authored graded DXF/Rule File. A
valid next experiment requires a primary-source-backed, lawful exact
representation of the product's size/grade relationship accepted by CLO's
native graded-DXF or Rule File path; no syntax or grade values are to be
guessed. S562 already provides the source point correspondence needed to
construct such a fixture once that representation is established.

No product source, pattern geometry, production code, legacy export behavior,
protected byte identity, V03 threshold, or G04 acceptance criterion changed.
The maintainer's written authorization covers product-development evaluation
and local processing. No physical-fit, factory-acceptance, or
production-readiness claim is made. CLO remains open because G04 still needs
practical receiver trials.

## Verification, board, and time

- `node --check analyze-clo-size-probe.mjs` passed.
- Analyzer matched six XS contours and zero contours for each other source
  size against the exact emitted paths at the unchanged 0.001 cm threshold;
  block-name and output-count assertions passed.
- CLO was visually inspected after import and re-import; the exported DXF was
  independently parsed and source-compared. No production-code change, full
  repository suite, or global coverage gate was due. Control Center tests
  passed 42/42 at slice exit; exit board commands use the validated command
  layer and were preflighted independently. Board replay is 3365→3367→3369.
- Started 2026-10-09 00:41:33 UTC from clean S562 `1011fed`; exit closeout at
  2026-10-09 00:55:45 UTC, elapsed 14m12s: implementation 0m; practical CLO
  import/export/re-import 5m; parsing and source comparison 3m; focused checks
  and rendered review 2m; durable packet/state/board and commit closeout 4m12s;
  external-agent waits 0m; maintainer-decision time 0m.

## Next action

Reserve S564 only after refreshing origin/history and board state. Find the
exact, primary-source-backed CLO input method and lawful representation for a
source-derived multi-size grade group, using S562's point map; otherwise
record the precise missing representation and continue other V03 gates that
can be independently tested. Keep every G04/V03 gate and hold unchanged.
