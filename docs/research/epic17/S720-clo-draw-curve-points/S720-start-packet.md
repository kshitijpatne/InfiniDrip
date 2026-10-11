# EPIC-17 / G04 V03 — S720 CLO draw-curve-points check

## Verified start and slice boundary

- Start: 2026-10-11 04:15:21 UTC from `fc3504649ac5871e5019896cc6c989e4b445eede` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 719; S720 is unique. No `Slice 720:` commit exists in reachable branch history.
- Canonical board revision 4207: G04-V01/V02 Done; G04-V03 and EPIC-17 In Progress. Goal record is active.
- The worktree has only the two pre-existing S700 untracked diagnostic files. Leave them untouched. Current-source Polo M input is `C:\G04-CAD-Interchange\S708-cut-layer-source-audit\polo-m-buttonhole-cross.dxf`, SHA-256 `734E8902D798D0D6FD4F911AF0902FF4C8EE1503B45BE3AABB6F649438FAE1DF`.
- The first app inventory exposed a stale CLO window ID. After one authorized launch and refreshed inventory, `sky.list_windows()` returned two indistinguishable windows with the same CLO app path and title; neither can be selected uniquely under the Computer Use workflow. No CLO input has been sent. The imported source copy is ready; all exchange files and captures stay under `C:\G04-CAD-Interchange\S720-clo-draw-curve-points\`.
- Input preflight at `C:\G04-CAD-Interchange\S720-clo-draw-curve-points\Evidence\S720-input-preflight.json` confirms the copied DXF is byte-identical, declares centimeters (`$INSUNITS=5`), and contains 18 closed-polyline entities with 4,829 vertices, but no `ARC`, `SPLINE`, or `LWPOLYLINE` outline entities.
- The S714 symmetric contour analyzer was copied to the C: evidence folder, parameterized for the new return path, then run once against the saved S711 output. It reproduces the S714 contour results: five CUT paths over `0.001 cm` and all nine SEW paths under it. This validates the planned comparison method before any S720 return exists.

## Why this check is distinct and bounded

S714 measured five failed CLO CUT contours on this source/route: missing source vertices cause `0.00258–0.03294 cm` deviations against the fixed `0.001 cm` limit. S715 confirmed retained vertices match source vertices and identified omitted shallow corners. Existing S503 cells tested AAMA/ASTM and `Optimize All Curve Points` on/off; the saved AAMA screenshots show **Import Draw Curve Points** unchecked in every cell. S711 reused the current S708 source and DXF-ASTM route but did not target that checkbox.

CLO's own support community answered a report of an incomplete ASTM-imported pattern by recommending that `Import Draw Curve Points` be checked. This supports one test of that specific control, not a compatibility or standards claim: https://support.clo3d.com/hc/en-us/community/posts/4408039776281-PROBLEMS-TO-IMPORT-PATTERN-DXF. CLO's current official guide separately documents AAMA/ASTM/Standard selectors and the fixed curve-optimization setting: https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export.

The exact S708 source contains closed `POLYLINE`/`VERTEX` outlines, not `ARC`, `SPLINE`, or `LWPOLYLINE` outline entities. The setting's applicability to this producer representation is therefore uncertain. The CLO support recommendation justifies one direct measurement, not an assumption that it fixes the file.

## Objective and method

Run one controlled two-cell differential in the already-installed CLO 2026.1.310 session. Import the same hash-verified S708 current-source Polo M DXF twice through **DXF-ASTM**. Keep the recorded S711 controls and exports identical; change only **Import Draw Curve Points** (off control, on candidate). Save unique outputs under the S720 C: folder. Capture each import settings dialog, warning state, actual rendered 2D pattern, export settings, output file and hashes. Current safe stopping point: do not send input until the window inventory exposes exactly one CLO target.

Use the existing symmetric contour-measurement method on both returns, with the unchanged `0.001 cm` threshold. Also record units, nine piece identities, CUT/SEW layers, typed marks and grainlines from both output files. Inspect the actual rendered pieces for missing/extra lines. The off control establishes the same-source baseline; the on cell is the single evidence-backed candidate setting.

## Stop rules and unchanged acceptance

- Stop a cell if CLO reports an import error or fails to show the expected nine pieces. Preserve the exact message and rendered state.
- Do not change any other format, setting, fixture, file encoding, source geometry, threshold, profile label, acceptance criterion, or export baseline. Do not try another application.
- A geometry pass on Polo M alone does not qualify CLO or pass V03. Keep every fixed requirement: rights and exact profile evidence; all-seven supported recipes/options/grades; `0.001 cm` geometry; units; piece/revision/grade/seam relations; CUT/SEW, marks and grainlines; malformed-input behavior; repeatability; readable receiver output; legacy DXF; and protected byte identities.
- Do not proceed to an all-recipe matrix unless this representative output clears every applicable fixed gate and route eligibility. No ANSI/AAMA/ASTM conformance, physical-fit, factory-acceptance, or production-readiness claim.

## Ownership and timing

This is a serial, stateful receiver UI check, so no disjoint low-risk delegated task exists. Codex owns the input/output evidence, rendered inspection, and closeout. No product code change is planned; changed-code coverage does not apply. At exit, record receiver work, focused evidence verification, external-agent waits, and maintainer-decision time separately. Run Control Center validation and `git diff --check` after validated board updates; defer the full repository gate until a settled integrated candidate.

## Next action

After a unique CLO target window is available, run the off/on pair once. Stop on the first measured failure of the on candidate and preserve all V03 holds. Update the durable packet, project state, context index, and canonical board before committing exactly one `Slice 720:` closeout.
