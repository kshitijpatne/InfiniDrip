# EPIC-17 / G04 V03 — Current gate matrix at S622 exit

| V03 acceptance area | Evidence at S622 | Status |
|---|---|---|
| CLO receiver operations | CLO 2026.1.310 (r58944) accepted Standard-DXF import, returned 9 patterns without API errors, and rendered all 9 pieces. | Demonstrated for one Polo M import only; receiver not qualified |
| Units and scale | Standard-DXF import used centimeters at 100%; reported native coordinates align with source centimeter values. | One fixture/profile observation only; no generalized unit contract |
| Piece identity | Nine source CUT contours were geometrically associated with native patterns 4,5,6,7,8,0,1,2,3; duplicate native child shapes are recorded where geometry ties. | Partial fixture-level geometry association; product piece/revision identity and CLO semantic shape identity open |
| CUT outline fidelity | 4/9 pass `0.001 cm`; five fail: 1.86781, 2.33034, 2.34012, and two at 93.1135 mm. The hash-pinned line-chain input retains each source CUT contour within the threshold, so the misses are present in queried post-import geometry. | **Fail / blocking** |
| SEW geometry | 4/9 pass `0.001 cm`; five fail by 0.44230–0.45497 mm. | **Fail / blocking** |
| Profile comparison | On the same fixture, prior DXF-AAMA swap-on import passes 0/9 CUT and 9/9 SEW; Standard-DXF passes 4/9 CUT and 4/9 SEW. Neither clears pre-export geometry. | Standard profile candidate closed for this fixture |
| Seven-recipe coverage | Only Polo M was exercised in this slice. | **Open / blocking** |
| Supported options and grades | No option or grade matrix was tested. | **Open / blocking** |
| Industrial profile identity and rights | Maintainer has confirmed CLO product-development evaluation and local processing in writing. That does not establish a normative DXF edition, a receiving license for broad compatibility claims, or an industrial profile. | **Open / blocking** |
| Layer and manufacturing semantics | CLO exposes native child shapes labeled “Base Line”; this query does not document original layer or import-stage semantics. | **Open / blocking** |
| Marks, notches, labels, seam allowances | Standard-DXF import showed no import error; complete semantic/retention inventory was not tested. With swap off, dependent Include Notches was disabled. | **Open / blocking** |
| Invalid/malformed input behavior | Not tested. | **Open / blocking** |
| Multi-generation stability | Not tested in S622; export was correctly withheld after the native CUT/SEW gate failed. | **Open / blocking** |
| Rendered detail and readability | CLO-native snapshot visibly contains nine outlines and internal lines. Fine manufacturing detail and semantic readability remain unproven. | **Partial / open** |
| V02 dependency and all-seven criterion | V02 remains Done; V03 exit still requires all seven supported recipes and representative exchange evidence. | **Open / required** |
| Legacy behavior / protected export identities | No product code, pattern, export baseline or product export changed. | Preserved; required regression gate remains |

S622 closes this Standard-DXF profile trial on the connected-LINE Polo M fixture. No DXF export was performed after the pre-export gate failed. All V03 and G04 acceptance criteria, thresholds, claim limits and holds remain unchanged. No exact compatibility, physical fit, factory acceptance, or production-readiness claim follows.

Evidence: `S622-exit-packet.md`, `analyze-standard-import-geometry.mjs`, and hash-pinned application/render evidence under `C:\G04-CLO-DXF-Exchange\S622-standard-dxf-connected-line-import\`.
