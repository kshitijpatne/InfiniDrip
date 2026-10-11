# EPIC-17 / G04 V03 — S711 exit packet

## Result

S711 completed exactly one CLO 2026.1.310 import/export using the existing DXF-ASTM path and the recorded S703 controls. The exact S708 Polo M current-source file was imported and the return was saved under the approved C: evidence folder. The application produced a file without an error dialog. No app, format, profile, or setting variation was run.

The test does **not** pass the targeted mark-retention check:

- The source contains three buttonhole crosses encoded as six LINE entities on `MARK_BUTTONHOLE`.
- The CLO return has nine named piece blocks and nine model-space INSERTs, with `_M` added to every piece name. It also adds nine model-space TEXT labels, which the strict named-piece reader rejects.
- Returned piece entities use numeric layers; there is no returned `MARK_BUTTONHOLE`, `CUT`, or `SEW` layer name in the parsed piece entities. The buttonhole-placket block has no source-identifiable buttonhole mark layer/entities.
- The three source cross centers are at (124.791237, 71.290826), (124.791237, 67.790826), and (124.791237, 64.290826) in the package drawing coordinates. The nearest POINT entity anywhere in the returned buttonhole-placket block is 0.249992 cm from each center; the nearest returned line/polyline segment is 1.499992 cm away. Neither distance meets the fixed 0.001 cm mark-anchor gate. These nearest entities are not claimed to be corresponding buttonhole marks.
- Source `$INSUNITS=5` declares centimeters. The returned file has no `$INSUNITS` declaration. The current return auditor therefore fails first with “Returned DXF does not declare centimeters”; no check is relaxed to proceed past it.

The S711 return is not a complete pass/fail evaluation of every V03 property. CUT/SEW contour deltas were not remeasured in this slice; S703's strongest existing evidence still proves five CLO CUT contours exceed 0.001 cm, and S711's mark-only source change does not clear that result. The returned DXF was not reopened/rendered after these measured identity, mark, layer, and unit failures; no readable-output pass is claimed. No all-seven/option/grade, repeatability, malformed-receiver, or profile eligibility gate was exercised.

## Evidence and hashes

- Exact source: `C:\G04-CAD-Interchange\S708-cut-layer-source-audit\polo-m-buttonhole-cross.dxf`; 285,209 bytes; SHA-256 `734e8902d798d0d6fd4f911af0902ff4c8ee1503b45be3aabb6f649438fae1df`.
- Return: `C:\G04-CAD-Interchange\S711-clo-current-marks-check\polo-m-clo-astm-roundtrip.dxf`; 1,561,421 bytes; SHA-256 `dca07b4b676a09c2643d21e1040941a6e316f405a9d3b82f97b614fca723f36d`.
- Machine-readable report: `C:\G04-CAD-Interchange\S711-clo-current-marks-check\S711-roundtrip-audit.json`.
- The CLO project was saved before the check to `C:\G04-CAD-Interchange\S711-clo-current-marks-check\clo-session-before-S711.zprj`; no CAD evidence was added to the repository.

## Gate disposition

- Current-source CLO pilot: **failed** on units, exact piece names, semantic layers and source-identifiable buttonhole marks; known contour failures remain from S703 and were not remeasured here.
- Industrial apparel receiver/profile and rights-reviewed exchange profile: **unproven**. “DXF-ASTM” is only the CLO menu choice; this evidence makes no ASTM, ANSI, or AAMA conformance claim.
- All-seven recipes, supported options/grades, stitch relations after return, repeated round trip, complete malformed-input UI behavior and readable output cohort: **unproven**.
- Source-side schema-v5 verifier on LibreCAD's saved S708 return: **passed for that one generic-CAD fixture in S710**; it does not make CLO pass.
- V01/V02, fixed thresholds, seven-recipe/options/grade scope, protected legacy bytes, and every V03 acceptance criterion remain unchanged. G04-V03 and EPIC-17 remain In Progress.

## Verification and time

- Product implementation: 0m; no source, test, or export behavior changed.
- UI import/export, setting confirmation, and returned-file diagnosis: approximately 9m.
- Focused evidence verification and packet/record updates: approximately 4m.
- Rendered return review: 0m because the returned file failed fixed identity/mark/unit gates before the predeclared output review stage.
- External-agent waits: 0m; maintainer-decision time: 0m.
- Start: 2026-10-11 02:35 UTC from S710 commit `93849c55554c565bb1052a271868dfd267f2632f`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S711 was uniquely reserved after S710. Canonical start replay advanced board revision 4171→4173; exit commands and closeout are recorded in the board.
- No full repository gate was run; it remains reserved for the settled integrated Epic/PR candidate. No new test was added. Existing return-audit/package and output files remain in their intended locations; no full-gate cadence changed.

## Next action

Return to S709's prioritized plan. Do not repeat CLO, LibreCAD, DGS, or OpenCAD modes, change entity encodings, or run a broad receiver matrix. Continue only with a source/code change tied to a measured gate and a decisive verification; preserve all fixed criteria. The final candidate still requires the full 100% repository gate, build/browser/Electron and rendered-output review, a necessary-file cleanup inventory, PR, safe merge, refreshed `origin/main` ancestry, required deployment, and production end-to-end verification. No physical-fit or factory-acceptance claim.

The validated Control Center suite passed 42/42. git diff --check passed after trimming the newly appended context/state/admission notes; only normal CRLF conversion notices remain.
