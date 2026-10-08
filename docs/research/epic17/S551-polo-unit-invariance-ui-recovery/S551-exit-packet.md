# EPIC-17 / G04 V03 — Polo unit-invariance UI recovery — Slice 551 exit

## Result

The controlled CLO DXF-AAMA millimeter exchange completed. The S549-prepared mm fixture is the same geometry as the cm Polo M/default source after dividing length coordinates by ten. The existing CLO session remained open throughout. A Save As copy of the pre-test project was saved first so the current session could be preserved; the safety copy, source DXF, mm input, exported DXF, screenshots, and analysis all remain only in `C:\G04-CLO-DXF-Exchange\S551-polo-unit-invariance-ui-recovery`.

The native Save/Open pickers were visible but absent from the accessibility tree. Screenshot-coordinate input successfully navigated those visible controls. The millimeter file was imported with CLO 2026.1.310 (r58944), DXF-AAMA, 100% scale, no rotation, import Draw Curve Points on, Optimize All Curve Points off, CUT/SEW swap off, notches to Both at Ratio. CLO displayed its known informational notice that seam allowances are preserved in Custom mode; this was not an error. The imported view showed the expected major body, collar, closure, and sleeve pieces.

The output was exported as DXF-AAMA, Graded Nest, millimeter scale, 100%, no rotation, duplicate notch on seam allowance on, Optimize All Curve Points off. Graded Nest was the selected UI mode, but this fixture is M/default only and contains no grade matrix. The saved post-export rendering showed the expected major pieces and no gross silhouette loss.

## Geometry comparison

The S551 parser compares all 18 source CUT/SEW outlines to receiver block contours using the same symmetric vertex-to-segment calculation and `0.001 cm` gate used by S545, after converting output coordinates from mm back to cm.

| Source ordinal | Receiver block/layer | Source → output vertices | Residual (cm) | Result |
|---:|---|---:|---:|---|
| 2 | `1_M` / `1` | 33 → 32 | 0.01274155 | fail |
| 10 | `5_M` / `8` | 54 → 53 | 0.01298757 | fail |
| 12 | `6_M` / `8` | 54 → 53 | 0.01396927 | fail |
| 14 | `7_M` / `1` | 44 → 43 | 0.01298806 | fail |
| 16 | `8_M` / `1` | 44 → 43 | 0.01298806 | fail |

The other 13 contours pass. No contour is missing. These are the same five source ordinals that fail in both S545 centimeter generations. Across all 18 contours, the largest absolute difference from either centimeter generation is `0.00003436 cm`; among the five failing contours, the largest difference from a centimeter generation is `0.00001863 cm`. The results therefore show that numeric unit representation alone does not explain the repeated Polo corner loss. The five failures remain about 13–14 times above the unchanged threshold.

The file contains 9 output blocks, 9 inserts, and 36 closed block contours. CLO's output repeats contours across layers; these counts do not establish CUT/SEW semantics. This run also does not locate whether the point loss occurs during CLO import or export.

## Durable C:-only evidence

- Source: `polo-standard-m-source.dxf`, SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- Mm input: `polo-standard-m-mm-input.dxf`, SHA-256 `8fb314343cdf54557e4d331b5aabc1916dc1ab77f45ac5a791d76f9ebe6874af`.
- CLO export: `polo-standard-m-mm-clo-export.dxf`, SHA-256 `864cbc16df325c041ac3b1acea16e660f9056ef5cc78a7140852adbaf2242b17`.
- Analysis: `polo-mm-roundtrip-analysis.json`, SHA-256 `DC8F2EF9D4CBD0C89EAD1C7999765A3D4F0643978D9ADFB46723F65FC91E2264`.
- Import render: `polo-mm-import-render.jpg`, SHA-256 `E38A5306E0FA251D40DFB53D031E1FFAAB3AF74ED41E259B8C215371BF4A582C`.
- Export settings render: `polo-mm-export-settings.jpg`, SHA-256 `6A88DFD7171F79EA4162AE75D29EB0B5514D3A06E0F15DD36619C4EAE20A2939`.
- Export render: `polo-mm-export-render.jpg`, SHA-256 `C5B17AF97FF797163A1253B73FED2B978F58C9B58E29FC76A1430DBE8093F440`.
- Pre-test CLO project copy: `clo-session-before-dxf-mm-test.zprj`, SHA-256 `7D2CEE99FE24F999FC580E42C3563899EA5996D1692DFD39C0E4503FAEC7FF6C`.

The analysis script is `analyze-mm-roundtrip.mjs`; it asserts the source and mm fixture hashes, exactly 18 input outlines, all five stable failing ordinals, and writes only to the named C: evidence folder.

## Gate disposition and next action

This one controlled test passed the UI-targetability, millimeter AAMA import/export, rendered gross-piece check, and per-contour analysis steps. It **fails** the unchanged Polo contour gate at five cuts, and it does not clear V03. It does not qualify an exact industrial profile edition, CUT/SEW or mark semantics, grades/options, malformed-input rejection, all-seven semantics, or independent receiver acceptance. The user's written authorization and local-processing confirmation are sufficient; no further permission decision is pending.

Keep the five Polo failures and all other V03 gates held. Do not repeat the same unit test or imply the numeric unit caused the loss. Continue with a targeted source/output diagnosis of why the five short incoming segments are omitted in both cm and mm, while preserving cut geometry and the acceptance threshold; then address remaining repeated all-seven semantic/profile blockers with evidence-led work. CLO remains open because V03 testing is not complete.

No pattern source, production code, protected baseline, or acceptance criterion changed. No physical-fit, factory-acceptance, or production-readiness claim is made.

## Verification, board, and time

- `node --check docs/research/epic17/S551-polo-unit-invariance-ui-recovery/analyze-mm-roundtrip.mjs` passed. The analyzer passed all source/input hash and failure-ordinal assertions and emitted the C:-only report.
- Screenshot review of both import and export output confirmed all major pieces were visible without gross silhouette loss; the geometry comparison remains authoritative for the five numeric failures.
- Board start/exit replay is `3317→3319→3321`; G04-V03 stays In Progress. `npm run control-center:test` and `git diff --check` are run at closeout. No production code or tests changed, so production coverage, build, protected-export suite, and full repository gate are not due for this evidence-only slice.
- Started `2026-10-08 23:09:41 UTC`; closed `2026-10-08 23:16:39 UTC` (6m58s). Implementation 0m; focused CLO exchange, rendered review, and geometry analysis ~4m; durable records, board, and focused verification ~3m; agent waits 0m; maintainer-decision time 0m.
- Exit board preflight passed and validated commands advanced the board `3319→3321`. `npm run control-center:test` passed 42/42; analyzer `node --check` and `git diff --check` passed.
