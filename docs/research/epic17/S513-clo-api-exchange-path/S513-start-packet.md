# EPIC-17 / G04 V03 — CLO in-app API exchange path — Slice 513 start

## Objective and boundary

Determine whether CLO's official Python API can make the authorized local DXF
trial reproducible through explicit file paths and fixed import/export options,
and identify the exact remaining limits for the user's CLO 2026.1.310 build.
Check official CLO API method and option documentation, the in-app script
workflow, and SDK version mapping. Do not operate the UI, execute a script,
install an SDK/plugin, or create/import/export a fixture in this documentation
slice. Any future exchange files remain restricted to
`C:\\G04-CLO-DXF-Exchange\\<named-slice-folder>`.

## Verified start and reservation

- Started `2026-10-08 17:51:56 UTC` from clean S512 commit
  `91171dae23b45115fa2d5bfc139f85d784747163` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  an ancestor. Highest assigned slice is 512; S513 is reserved. Board revision
  3163 has V01/V02 Done and V03/EPIC-17 In Progress.
- Re-read current context, project state, decisions, admission, Control Center
  board and S512 exit. S510's desktop helper failure remains the latest
  supported app-control evidence; the user currently reports CLO open.

## Exit test

Find direct official sources for in-app script invocation, DXF import/export
methods, option fields and exact-build SDK compatibility. Distinguish what can
be fixed by code from what still requires interactive app operation or measured
exchange evidence. Preserve every V03 gate and all-seven fixture criterion;
do not infer format acceptance from API availability. Documentation-only:
validated board replay, focused Control Center tests, and diff check; no
production-code/full repository gate is due.
