# EPIC-17 / G04 V03 — AAMA swap-lines import check — Slice 621 exit

## Result

CLO 2026.1.310 (r58944) imported the same S574 connected-LINE Polo M fixture with DXF-AAMA, centimeters, 100%, no rotation, Maintain Original, and only **Swap Cutting Line and Sewing Line** enabled relative to S574's AAMA/no-swap trial. CLO also enabled the dependent **Include Notches** option, targeting Pattern Outline at Ratio, as in its previous S540 swap-option trial. Other observed settings remained annotations off, auto-trace off, import notches Both at Ratio, auto-distribute off, Optimize All Curve Points off, Import Draw Curve Points on, and Remove Non-Grading Points off. CLO displayed the familiar informational notice that there are no seam allowances and the pieces are imported in Custom mode to preserve their shape; no import error appeared.

The app rendered nine pieces and the getter returned nine patterns without errors. The source SEW contours match their ordinal-bound native patterns **9/9** within the unchanged 0.001 cm gate. Source CUT contours match their same-piece native pattern **0/9** within that gate. Best exact-cycle deviations for seven pieces range from 1.4142 cm to 9.3109 cm; two stand CUT contours have no same-point-count native candidate. The saved view shows all nine imported pieces; this visual result does not assign semantic roles to CLO's undocumented `Base Line` shapes.

Compared with S620's hash-pinned AAMA/no-swap getter response for the same input, the ordered native point lists are **identical in all nine patterns**. This is direct evidence for this CLO build, fixture, and settings that enabling the swap option did not change native geometry. No DXF export was attempted because the pre-export CUT gate failed; no round-trip claim is supported. This closes the S574 AAMA swap-lines route for this fixture.

## Evidence and verification

- Input copy: `C:\G04-CLO-DXF-Exchange\S621-aama-swap-lines-import\Input\polo-source-m-cut-lines.dxf`, SHA-256 `A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675`; its S574 derivative record confirms exact source endpoint strings and closed line chains.
- Saved imported project: `C:\G04-CLO-DXF-Exchange\S621-aama-swap-lines-import\Project\clo-aama-swap-lines-import.zprj`, SHA-256 `4B75D868EE9F4CEE883811DA484DE33C6EA0CC5AF333970DBB7C8E46D3E49642`.
- Getter output: `C:\G04-CLO-DXF-Exchange\S621-aama-swap-lines-import\Evidence\preexport-input-information.json`, SHA-256 `9B9120D5B0FB2ABD09A54633E8E28A859A00AFFA0C6C5F4DF523B8C2BB86E164`.
- Geometry comparison: `C:\G04-CLO-DXF-Exchange\S621-aama-swap-lines-import\Evidence\preexport-cut-sew-comparison.json`, SHA-256 `C2581A0E779C10FF58288BFB2B42674268EF0B37C68D0E22D7D6E696D712271B`. It pins source/input/project provenance, ordinal binding through the corresponding SEW path, the 0.01 mm tolerance equivalent to 0.001 cm, all per-piece candidates, and equality against the S620 no-swap native point lists.
- CLO 2D snapshot: one-page PDF `C:\G04-CLO-DXF-Exchange\S621-aama-swap-lines-import\Evidence\clo-swap-import-render.pdf`, SHA-256 `F103BED72CAD87728473FBF97260F9A82DE54E4CDB15A2D1D2ED7593C2DDA82D`; rendered and visually inspected PNG at the same named location has SHA-256 `BEA0E4E02FED09CD03B8DB184D279A6A620334CD033A26EFFDF4ABC4EDF3FEBF`. All nine piece outlines fit the page. CLO's default snapshot line colors are pale, so the picture is used to confirm the rendered piece count and overall closed-looking outlines only; role/geometry acceptance comes from the measured native point lists.
- The CLO getter uses only `GetPatternCount`, `GetPatternPieceName` and `GetPatternInputInformation`. `node --check`, the hash/profile/geometry/render preflight, `npm run control-center:test` (42/42), validated board exit replay and `git diff --check` pass. Research/evidence only; changed-production-code coverage does not apply.

## Gates, holds, and next action

V03 receiver/profile, CUT geometry, semantics, marks, grading, negative-input, supported-fixture breadth, repeatability, export/import round trip and exact-compatibility gates remain open. V02 is Done, V03 and EPIC-17 remain In Progress. The all-seven scope, protected export identities, legacy DXF behavior and 0.001 cm threshold are unchanged. CLO stays open. No physical-fit, factory-acceptance or production-readiness claim is made.

**Next:** compare CLO Standard-DXF import against AAMA using this same connected-LINE fixture, with swap off and all other settings held to the S574 baseline. Query native geometry before export. If that native CUT gate also fails, stop further CLO profile permutations on this fixture and move to the next rights-qualified receiver candidate.

## Time

Slice started at 2026-10-09 13:35:34 UTC. Separate implementation/UI work, analysis, focused verification/durable closeout, external waits, and maintainer-decision time are recorded in `PROJECT-STATE.md` at this boundary.
