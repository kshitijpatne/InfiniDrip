# EPIC-17 / G04 V03 — CLO Standard-DXF R14 import hypothesis — Slice 625 exit

## Result

The bounded R14-container hypothesis fails in CLO 2026.1.310 (r58944). The hash-pinned Polo M AC1014 fixture imported through CLO's Standard DXF route and produced nine queryable native patterns with zero API errors, but only 4/9 source CUT contours and 4/9 source SEW contours meet the unchanged `0.001 cm` (`0.01 mm`) symmetric-geometry gate. The pre-export gate therefore fails. No CLO DXF export or round trip was performed.

This is a same-count result, not an unchanged error pattern, relative to S622's CLO Standard-DXF test of the R12/connected-LINE fixture. S625's five CUT failures are 1.867810, 2.330319–2.340121 mm; in S622 two of the five were approximately 93.1135 mm. The R14 file reduces those two large deviations but still fails five CUT contours. The five SEW failures remain in the 0.442299–0.454972 mm range. The tests do not identify CLO's internal conversion stage or cause.

## Exact test and observed profile

- Receiver: CLO 2026.1.310 (`r58944`), the already-running desktop session; local-only product-development use is authorized by the maintainer's written confirmation.
- Input: `C:\G04-CLO-DXF-Exchange\S625-clo-standard-r14-import-test\Input\polo-m-r14.dxf`, SHA-256 `AA6E409E84345DB89E094CC3AE8F131BEC0EC0B21373B57B3DC0DCDF7D3A7C1C`. It is the S624 Open CAD Studio AC1014 output whose CUT/SEW geometry was measured source-exact before this receiver test.
- CLO project: `Project\polo-m-r14-standard-import.zprj`, SHA-256 `AFC60121F8810D3B565415B57828973B681A699D78EBA282C188322D513FD990`.
- Import: Standard DXF; centimeters; 100%; Do Not Rotate; Maintain Original grain; swap CUT/SEW off; Auto Distribute off; Optimize All Curve Points off; Import Draw Curve Points on; Remove Non-Grading Points off; annotations off; Auto Trace Internal Line off. The dialog's dependent `Include Notches` control was disabled with swap off. The separate lower `Import Notch to` control was enabled, set to Both, position Ratio. The API capture records these separately.
- Read-only CLO API query: `GetPatternCount`, `GetPatternPieceName`, and `GetPatternInputInformation` returned 9 patterns and no API errors. Native shapes were associated geometrically against all source CUT/SEW contours without relying on piece order, names, or layer number as semantic proof. The comparison samples both directions at 0.01 mm spacing and adds a conservative 0.005 mm bound.
- Render: the saved CLO 2D PDF contains nine pieces, but several curved outlines show long spikes/stray projections. The contours are visibly damaged in addition to failing the numeric gate. The saved PDF and PNG are under the C: evidence folder.
- Export gate: **failed** at pre-export. `Output\` contains no DXF. No export action was taken.

## Durable evidence and hashes

All receiver files are confined to `C:\G04-CLO-DXF-Exchange\S625-clo-standard-r14-import-test\`:

| Evidence | SHA-256 |
|---|---|
| `Input\polo-m-r14.dxf` | `AA6E409E84345DB89E094CC3AE8F131BEC0EC0B21373B57B3DC0DCDF7D3A7C1C` |
| `Project\polo-m-r14-standard-import.zprj` | `AFC60121F8810D3B565415B57828973B681A699D78EBA282C188322D513FD990` |
| `Evidence\preexport-input-information.json` | `69702530045326E65034FC5A321BA97B5F2DF746A8BDFC55FCD79DC178E22080` |
| `Evidence\preexport-cut-sew-comparison.json` | `C779637738C9CC3E2744E3DB8A76E0D6CF13B9B116CAA135AF610443DBE32989` |
| `Scripts\read-s625-preexport-input-information.py` | `268DCD99BD4C4719255F13E338D5786D20560C457D5DF5956F2E577207CE0323` |
| `Renders\clo-r14-standard-import-scene.pdf` | `EC23F0A90AD86C7357089740E7A130C485133EC39C65AB3BC1520B334238D171` |
| `Renders\clo-r14-standard-import-scene-1.png` | `F40A2B05C0B0CCD2D39CD06EB8F0F3F7FE59DDB28A6764D573D6FB910051AB55` |
| `Evidence\script-started.txt` | `F0A6FF5E88B4D137232544A8A0465A17CB8CB2DD4EA9434ADB5EB0D76258F47A`; created by the corrected script during this closeout and confirms the CLO editor ran the checked-in C:-only reader |

The query script is read-only and makes no pattern/project setters or export calls. The disposable imported project was saved before the query and was not changed by the query. The source fixture and the project copy remain unchanged. There is no DXF in `Output\`.

## V03 disposition

S625 closes only the specific hypothesis that replacing the S622 R12 container with geometry-identical AC1014 would make CLO Standard-DXF native geometry pass. It does not qualify or disqualify every CLO exchange route and makes no inference about the receiver's internal processing. The tested CLO Standard-DXF route is rejected for this fixture/build/profile under the fixed pre-export criteria.

S624 remains a positive but bounded local **general-CAD** R14 result. Taken together, S624 and S625 show why format parsing and visible import are insufficient: a general CAD receiver preserves the tested source contours, while CLO accepts/renders R14 but materially changes native outlines. Neither result establishes an applicable industrial apparel profile or full V03 compatibility.

All existing V03 criteria remain unchanged: applicable receiver/profile rights and identity, centimeter semantics, all seven recipes and supported options/grades, CUT/SEW plus manufacturing marks and piece/revision identity, malformed-input policy, repeated round-trip behavior, rendered output, and protected export/legacy behavior. V02 remains Done. G04-V03 and EPIC-17 remain In Progress. No physical-fit, factory-acceptance, or production-readiness claim is made.

## Verification and closeout

- The S625 analyzer was corrected to assert the separately observed disabled `Include Notches` state and enabled `Import Notch to Both` state, then rerun against the CLO-generated read-only API capture.
- Analysis: 4/9 CUT and 4/9 SEW pass; all 18 do not pass. Maximum bounded residuals are 2.340120925973829 mm CUT and 0.45497215429687204 mm SEW.
- The PDF was rasterized and visually reviewed; nine shapes are present, with visibly damaged curves. The render does not pass the no-gross-damage pre-export condition.
- No product source, pattern, stitch graph, DXF writer, export baseline, protected byte identity, or acceptance criterion changed. Product-code coverage is not applicable. Focused Control Center tests, packet/matrix preflight, helper syntax check, board command validation, and `git diff --check` are required at this closeout. Full-repository gates remain reserved for the settled integrated Epic/PR candidate.
- Validated start replay was `3637→3639`; exit replay is `3639→3642`. The 42-test Control Center suite, S625 start/exit preflights, analyzer syntax and run, and `git diff --check` passed.
- A post-exit rerun of the start preflight initially rejected board revision 3642 because it only allowed start revisions 3637/3639. The preflight was corrected to accept the already-closed exit revision and assert both start and exit evidence; the rerun passes. No board state was changed by that failed check.
- The boundary is recorded at 2026-10-09 15:20:55 UTC (23m35s after the 14:57:20 UTC start). Approximate time allocation: CLO import/query/project/render evidence 8m; geometry analysis and evidence correction/requery 5m; durable packet/matrix/state/board plus focused verification 10m35s; product implementation 0; agent waits 0; maintainer-decision time 0. No independent low-risk work had disjoint ownership from the single CLO evidence chain.

## Next action

Reserve S626 after committing this boundary and refreshing `origin/main`, branch history, board revision, and dirty state. Choose the next test from the current V03 gate matrix, requiring one source-pinned, receiver-measurable hypothesis and a pass/fail artifact for a still-open gate; do not repeat CLO Standard-DXF import variants on this fixture or export any further failed contour set. Keep every V03 gate and claim limit unchanged. CLO remains open for the active Epic work.
