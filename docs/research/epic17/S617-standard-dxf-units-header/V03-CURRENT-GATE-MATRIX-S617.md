# EPIC-17 / G04 V03 — Current gate matrix at S617 exit

| V03 acceptance area | Evidence at S617 | Status |
|---|---|---|
| CLO receiver operations | CLO 2026.1.310 imported a centimeter-declared Standard-DXF fixture, exported a graded DXF-ASTM-labeled file, and re-imported nine gross pieces without a format error. | Demonstrated for one Polo M case only; not qualification |
| Units and scale | Adding truthful `$INSUNITS=5` to a disposable copy fixes the previous 0.1× emitted scale on this Standard-DXF path. | Partial single-fixture observation; no product-writer change or generalized contract |
| Piece binding and SEW geometry | Nine emitted blocks bind via source SEW contours; 9/9 SEW pass the unchanged 0.001 cm threshold. | Single Polo M profile/settings only |
| CUT outline fidelity | Four of nine CUT outlines pass; five fail by 0.01299–0.01423 cm and each has one fewer vertex than source. | **Fail / blocking** |
| Seven-recipe coverage | Only Polo M was exercised in this slice. | **Open / blocking** |
| Supported options and grades | No option/grade matrix tested in S617. | **Open / blocking** |
| Industrial profile identity and rights | CLO settings label DXF-ASTM and file advertises AC1009; neither proves a normative edition, receiver profile, or rights to claim compatibility. | **Open / blocking** |
| Layer and manufacturing semantics | Numeric output layers observed; CUT/SEW and mark meanings not established. | **Open / blocking** |
| Marks, notches, labels, seam allowances | One informational Custom-mode seam-allowance notice; no semantic/retention inventory in this trial. | **Open / blocking** |
| Invalid/malformed input behavior | Not tested. | **Open / blocking** |
| Multi-generation stability | One CLO export/re-import generation. | **Open / blocking** |
| Rendered detail and readability | Nine gross pieces visibly rendered on re-import. Fine marks/readability and full industrial detail not established. | **Open / blocking** |
| V02 dependency and all-seven criterion | V02 remains Done, but V03 exit still requires all seven supported recipes and admitted representative evidence. | **Open / required** |
| Legacy behavior / protected export identities | No product code, pattern, export baseline or product export changed. | Preserved; required regression gate remains |

All blockers, acceptance criteria and holds remain unchanged. Do not call this exact format compatibility, industrial CAD qualification, physical fit, factory acceptance, or production readiness.

Evidence: `S617-exit-packet.md`, `analyze-header-fine-roundtrip.mjs`, and C:-only input/output/renders/scenes in `C:\G04-CLO-DXF-Exchange\S617-standard-dxf-units-header\`.
