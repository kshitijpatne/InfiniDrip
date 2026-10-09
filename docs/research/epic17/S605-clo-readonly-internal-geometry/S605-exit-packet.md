# EPIC-17 / G04 V03 — CLO read-only geometry identity — Slice 605 exit

## Verified boundary and result

- Started from S604 commit `505d3faccfa88ac4e7b3efc48614c266db795b10` on `codex/epic-17-g04`; `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S605 was uniquely reserved. Board start replay advanced revision 3550→3552; G04-V02 remains Done and G04-V03/EPIC-17 remain In Progress.
- CLO 2026.1.310 (r58944) remained running with the S603 disposable project open. Product-development use and local-only file handling are confirmed in writing. No project switch, selection change, setter, grade input, save, DXF import/export, or geometry edit occurred. The script and raw output are in `C:\G04-CLO-DXF-Exchange\S605-clo-readonly-internal-geometry\` only.
- The helper queried `GetPatternCount` (3), `GetPatternPieceName`, and `GetPatternOutlinePoints` for indexes 0–2. CLO returned numeric names `0`, `1`, `2` and an empty outline-point list for each. The attempted internal-shape enumeration failed on each pattern with `NameError("name 'utility_api' is not defined")`; therefore `GetPatternInternalShapePoints` was not called.
- This exact-project capture cannot identify the waistband piece or separate its CUT outline from the internal SEW path, and no comparison to S567 geometry can be made. The S603 grading hold remains. This result clears no V03 gate and provides no DXF compatibility claim.

## Context against prior exact-build evidence

S582 already inventoried the exact CLO `pattern_api` namespace: 217 names were present, while `GetInnerShapeList` and `GetInternalShapeInformation` were absent. `GetPatternInternalShapePoints` was present, but its documented indexing requires the unavailable internal-shape list/order. S581 separately received an exact `AttributeError` for `pattern_api.GetInternalShapeInformation`. The present `utility_api` NameError is a distinct namespace failure and does not justify another broad API inventory. `GetPatternOutlinePoints` returning empty here also cannot support contour mapping. No further getter trial is authorized by this slice.

The S605 query plan should have stopped before runtime: it did not reconcile the planned shape enumeration against S582's exact-build absent-name inventory, and the helper attempted a `utility_api` binding that the editor did not define. Record this as a planning/execution miss, not as new evidence about CLO's DXF exchange behavior. The already-captured S582 inventory and S581 attribute error are the controlling API availability evidence; no additional attempt is warranted.

## Evidence

- Helper: `C:\G04-CLO-DXF-Exchange\S605-clo-readonly-internal-geometry\s605-readonly-geometry.py` — SHA-256 `A4BECB3DDA78320339AB2AC0848497F184EF347C4B60A2E70AC247B0BCC8EAC7`.
- Raw JSON: `C:\G04-CLO-DXF-Exchange\S605-clo-readonly-internal-geometry\s605-clo-internal-geometry.json` — SHA-256 `1923A3D71085F81B58A2BC8BF8A6C4CEF41A5B23AE79A26DA305150C0662935E`. It parses as JSON and records 3 indexed pieces, 3 per-piece errors, empty outlines and no fatal error.
- CLO Python Editor screenshot: `C:\G04-CLO-DXF-Exchange\S605-clo-readonly-internal-geometry\Evidence\s605-clo-query-editor.jpg` — SHA-256 `393335BA283095587BE77B1680C02E2B6DF19D64AA15DD6DBB65CF95811EC2D3`.
- The CLO UI showed the script opened from the named C: folder and the S603 waistband grading scene remained in the background. The screenshot verifies execution context, not internal geometry identity.

## Decision, gates, and next work

Keep the S603 source-path grading trial held. Do not repeat the API survey or infer CUT/SEW semantics from numeric pattern names, empty outline data, or API labels. Preserve all V03 gates, the 0.001 cm contour threshold, all-seven-recipe acceptance, V02-before-V03, legacy DXF behavior, protected export byte identities, and the recorded prohibition on fit/factory/production-readiness claims.

At S606, return to the current V03 acceptance matrix and select one remaining **actual exchange** gate with existing source and round-trip fixtures. CLO is a narrow evaluated receiver candidate, not a qualified industrial profile. The controlling practical result remains S595: only 4/9 Polo CUTs pass, 5/9 fail, and 9/9 SEWs pass at 0.001 cm; S601 establishes only that its emitted file reopens and renders. Do not revisit the CLO API route. Prioritize a bounded receiver/profile or actual exchange gate that can directly improve the acceptance evidence; preserve every hold unless its defined evidence passes.

## Timing and verification

Slice start: 2026-10-09, after the S604 boundary. Runtime setup/query and output inspection: approximately 8 minutes. Durable closeout, board replay and focused verification: approximately 7 minutes. External-agent waits: 0 minutes. Maintainer-decision time: 0 minutes; the written product-development and local-processing confirmation removed those questions before this slice.

Validated exit replay advances board revision 3552→3554 and leaves all work-item statuses unchanged. Focused checks: raw JSON schema/content/hash, S605 exit preflight/replay, Control Center focused suite, command syntax, and `git diff --check`. No product source or tests changed; no changed-code coverage or full repository gate is due. Full gates remain reserved for the settled Epic/PR candidate.
