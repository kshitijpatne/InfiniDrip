# EPIC-17 / G04 V03 — CLO Standard DXF inverse-scale diagnostic — Slice 507 exit

## Result

**The reciprocal scale experiment restores the nine tested Polo M piece bounds, but does not pass the exchange gates or establish a usable production profile.** CLO Standard DXF imported at 1000%, followed by ASTM export and ASTM reimport/export at 100%, produced all nine pieces at source scale. The five previously known contour deviations remain above the unchanged `0.001 cm` geometry threshold, and the second export again omits six polyline records. V03 remains In Progress with every acceptance criterion unchanged.

## Reproduction and configuration

- CLO version visible in the workspace: `2026.1.310` (the owner also reported this version). The app was signed in and reached the normal pattern workspace; no credential or security dialog was automated.
- Input: `C:\G04-CLO-DXF-Exchange\S507-clo-standard-scale-diagnostic\Input\polo-standard-m.dxf`, 24,261 bytes, SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`, identical to the S505/S503-pinned Polo M source.
- First import: Standard DXF; centimeter; **1000%**; Do Not Rotate; Maintain Original grain; Import Notches Both / Ratio; Optimize All Curve Points off; remaining S505 options unchanged/off.
- CLO displayed an information notice: the DXF contains seam allowances, imported in Custom mode to preserve their original shape. The notice was acknowledged; “Don't Show Again” remained unchecked.
- First export: DXF-ASTM; Graded Nest; centimeter/100%; Do Not Rotate; Duplicate Notch on Seam Allowance on; Optimize All Curve Points off.
- Reimport: DXF-ASTM; centimeter/100%; Do Not Rotate; Maintain Original grain; notches Both / Ratio; Optimize All Curve Points off.
- Second export used the same ASTM settings as the first. No cloud, CLO-SET, or CONNECT operation was used.
- Projects were saved before each export in the S507 `Projects` folder. Live settings and rendered evidence are in the S507 `Evidence` folder. The app was closed normally after capture; a fresh app inventory reported `isRunning: false` and no CLO windows.
- After that close, the user reported CLO running. A fresh inventory initially showed it stopped; a relaunch reached CLO's Intel-graphics information dialog and sign-in splash. The desktop helper then returned `foreground window did not report a process id` during refreshed window inspection. No pattern or file was opened in this startup session, no DXF operation occurred, and no further input was sent. The last successful app inventory showed CLO running at the startup dialog; its later close state could not be verified. This is a desktop-control limitation, not a CLO DXF result.

## Measured findings at original scale

The replay analyzer used the hash-pinned source geometry directly and applied no scale normalization. All nine output/source width and height ratios range from `0.99999808` to `1.00000114`; the largest per-dimension bound delta is approximately `0.000003 cm`. The source-scale symptom seen with S505's 100% Standard import is therefore corrected in this one 1000% import configuration.

| Piece | Source bounds (cm) | First ASTM output bounds (cm) | Contour gate |
|---|---:|---:|---|
| Front | 2.850000 × 7.327400 | 2.850001 × 7.327400 | No violating witness found; not a maximum-distance proof |
| Back | 2.850000 × 7.474200 | 2.850001 × 7.474200 | **Fails**; witness `0.010145 cm` |
| Sleeve | 4.528800 × 2.678700 | 4.528800 × 2.678700 | No violating witness found; not a maximum-distance proof |
| Button placket | 1.000000 × 1.600000 | 1.000000 × 1.600000 | No violating witness found; not a maximum-distance proof |
| Buttonhole placket | 1.000000 × 1.600000 | 0.999999 × 1.600000 | No violating witness found; not a maximum-distance proof |
| Outer collar stand | 1.564400 × 1.959700 | 1.564401 × 1.959699 | **Fails**; witness `0.012111 cm` |
| Inner collar stand | 1.564300 × 1.959700 | 1.564297 × 1.959699 | **Fails**; witness `0.012189 cm` |
| Upper pointed collar | 1.760000 × 2.292300 | 1.760002 × 2.292300 | **Fails**; witness `0.012110 cm` |
| Under pointed collar | 1.760000 × 2.292300 | 1.760000 × 2.292300 | **Fails**; witness `0.012111 cm` |

The contour witnesses use the existing source-specific analyzer and measure a violating sampled source point to the exact output polyline segments. The five contour failures are therefore well above `0.001 cm`; they are the known back, both collar stands, and both pointed collars. The visual import/reimport screenshots show the piece set rendered; renderability does not waive the numeric failures.

The first export contains 100 parsed polyline records. The round-trip export contains 94: 94/100 first-export records match within `0.001 cm`, with maximum matched-vertex displacement `0.0000022361 cm`; six closed four-vertex shapes are absent. They are three distinct shapes in block `3_M`, each duplicated on numeric layers `8` and `85`. Numeric layer meanings are not inferred. The missing-record identities and bounds are in `Evidence\Analysis\roundtrip\standard-import-roundtrip-diff.json`.

## C-drive evidence and hashes

- First ASTM export: 199,021 bytes; SHA-256 `54e2797d7c926b6c2aede1b0454c725efb5ca739a59e1d9908d114ba08828558`.
- Second ASTM export: 196,694 bytes; SHA-256 `75281e581f354ec4c619ac60c710137548163c79a861e35cae3f47ff4ba62893`.
- Native project before first export: `Projects\s507-standard-1000-import.zprj`, 2,243,192 bytes.
- Native project after ASTM reimport, before second export: `Projects\s507-standard-1000-reimport.zprj`, 2,245,300 bytes.
- Rendered and settings evidence: `Evidence\standard-import-1000-settings.jpg`, `Evidence\standard-import-1000-render.jpg`, `Evidence\astm-export-settings.jpg`, `Evidence\astm-reimport-settings.jpg`, `Evidence\astm-reimport-render.jpg`, `Evidence\second-astm-export-settings.jpg`, and `Evidence\final-reimport-render.jpg`.
- Analysis: copied/replayed S505 contour analyzer adapted to compare at source scale in `Evidence\Analysis\analyze-s507-standard-1000.mjs`; reports/overlays are in `Evidence\Analysis\1000-import\` and `Evidence\Analysis\roundtrip\`. `Evidence\Analysis\compare-s507-standard-roundtrip.mjs` produces the record-retention diff. All import/export files, native projects, screenshots and analysis remain inside the named S507 folder on C:.

## Gate disposition and remaining work

- **Scale diagnosis:** passed only for this source, CLO version, Standard import at 1000%, and tested ASTM export/reimport settings. Do not recommend 1000% as a user-facing workaround or extrapolate it to other sources, options, receivers, or profiles.
- **Geometry:** failed at the unchanged `0.001 cm` threshold on five Polo CUT contours.
- **Round trip:** failed; six records disappear again. No layer semantics or manufacturing meaning are assigned to them.
- **Rights/local handling and industrial profile:** still unestablished. This trial does not select CLO as the V03 receiver and does not claim commercial-use permission, apparel-CAD profile compatibility, or standards conformance.
- **Still required:** exact receiver/build and documented industrial profile; rights and local-file-handling basis; passing source-scale geometry/mark/layer/units behavior; round-trip retention; native grade semantics; negative-control behavior; representative fixtures covering all seven recipes; and rendered evidence for those fixtures.
- **Unchanged:** G04 V02's all-seven acceptance, V02-before-V03 order, legacy DXF behavior, protected export byte identities, the `0.001 cm` threshold, grade and negative-control gates, and physical/factory-acceptance limits. No source geometry, production code, test, baseline, or acceptance criterion changed.

## Verification, boundary, and next action

- Start: `2026-10-08 16:37:25 UTC`, clean S506 `968c72644bd6dde9e7ca8e13764dee0c5b155878`, `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Start board replay `3139→3141`; S507 is the next unique slice.
- Focused checks: source-copy SHA-256 verified; both live import/export/reimport sequences completed; both outputs were parsed; all nine piece bounds, the five contour witnesses, and all 100→94 round-trip records were compared; rendered pieces were visually inspected; evidence hashes and file locations checked. No production code changed, so no changed-code coverage target applies. Repository-wide coverage/build/browser/output gate remains for the settled integrated Epic candidate.
- Validated Control Center command replay adds `E-G04-S507-EXIT` and a G04-V03 finding without changing status or criteria; S507 does not close V03.
- Elapsed from start through evidence capture was approximately 12m50s; this durable closeout and post-test startup check add about 10 minutes. Implementation `0m`; focused live UI/geometry verification `~8m`; evidence analysis and packet/record closeout `~14m50s`; external-agent waits `0m`; maintainer-decision time `0m`.

**Next action:** continue V03 candidate discovery only through a concrete rights/local-handling-qualified receiver/profile. The 1000% factor is diagnostic evidence, not a selected profile or accepted workaround. Preserve the six-record and five-contour blockers, all-seven fixture gate, and all other V03 acceptance criteria.
