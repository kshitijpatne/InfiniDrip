# EPIC-17 / G04 V03 — CLO outline-line info runtime check — Slice 580 start

- Started 2026-10-09 05:05:10 UTC.
- Branch `codex/epic-17-g04`, clean start at S579 commit `640dcac7843b5b99e29a27e7da7aefc4dbd02341`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- Canonical board revision 3433: EPIC-17/G04-V03 In Progress; V02 Done.
- Highest assigned slice 579; reserve S580. Goal active. Ordinary usage allowed (primary 6%, weekly 69%).

## Objective

Run one read-only `pattern_api.GetPatternLineInfo(index)` query for each of the nine pieces in the already-running CLO 2026.1.310 S574 Polo import project. Record count/name/returned JSON and compare the actual boundary-line endpoints, lengths, bounding boxes and line counts to the hash-pinned S574 source CUT geometry where the documented coordinate frame permits. Save script/output and an app screenshot only under `C:\G04-CLO-DXF-Exchange\S580-clo-line-info-runtime`.

## Safety and acceptance limits

- Inspect the current CLO window before acting. Do not launch/close/restart the app, alter geometry, import/export DXF, call setters, save the project, or decode project containers.
- Only read-only calls: `GetPatternCount`, `GetPatternPieceName`, `GetPatternLineInfo`. Do not call line delete/pin or any mutator.
- Pass this evidence probe only if it returns parseable pattern identity and boundary lines for the nine expected indices, with an auditable source comparison. If it returns useful data but incomplete curve/role semantics, mark only the specific evidence subgate supported; keep all V03 criteria pending.
- The docs do not promise curve control points or CUT/SEW roles. Never infer semantics from a piece name or line index. Keep 0.001 cm as the comparison threshold; fail closed when the coordinate transform or edge correspondence cannot be demonstrated.
- All-seven V02 is Done per the verified board and S459 record. Preserve V02-before-V03, all V03 rights/round-trip evidence, legacy DXF, protected export identities, and claim boundaries. No physical/factory/production-ready claims.

## Verification and exit

No safe independent delegation for one exact-build query. Review the script's API symbol allowlist before running, inspect JSON and rendered CLO state after, compare against the C:-only S574 source fixture, then update the packet/state/board. Focused checks: script syntax and output-schema validation, validated board preflight/replay at 3433→3435 start and 3435→3437 exit, `npm run control-center:test`, and `git diff --check`. No full repository gate for this evidence-only slice. At exit report research/execution, focused verification, external waits and maintainer-decision time separately. CLO remains open.
