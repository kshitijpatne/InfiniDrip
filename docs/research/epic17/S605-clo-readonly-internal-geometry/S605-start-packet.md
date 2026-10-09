# EPIC-17 / G04 V03 — CLO read-only internal geometry identity — Slice 605 start

## Verified start

- Started 2026-10-09 after S604 commit `505d3faccfa88ac4e7b3efc48614c266db795b10` on `codex/epic-17-g04`. Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S604 is the latest and highest assigned slice; S605 is unique. The canonical board is at revision 3550; EPIC-17/G04-V03 remain In Progress and G04-V02 is Done.
- CLO 2026.1.310 (r58944) is already running with the S603 disposable S565 waistband workcopy and its ambiguous CUT-point grading selection visible. Keep this existing process open; do not load a new project or change the pattern.
- Product-development use and local-only file handling are confirmed in writing. All query scripts and raw results for this slice go only in `C:\G04-CLO-DXF-Exchange\S605-clo-readonly-internal-geometry\`.

## Objective and limits

Determine whether the installed CLO runtime exposes the documented read-only geometry getters and use them to map the waistband's outline and internal shapes against the exact S567 source CUT/SEW contours. The purpose is to identify whether the S603 selected point can be tied to a unique source contour before any future grading action.

- Allowlisted calls only: `GetPatternCount`, `GetPatternPieceName`, `GetPatternOutlinePoints`, `GetPatternInternalShapePoints`, and other read-only enumeration functions only if documented and necessary to determine internal-shape indexes.
- No setters, point grading, selection changes, save, import, export, project switching, geometry edits, or acceptance changes.
- Capture returned data and hashes under the named C: folder. Compare in a deterministic analyzer to exact pinned source contours and note the API coordinate-frame caveat from its documentation.
- If API methods are absent, errors occur, or source matches are not unique, stop and retain the hold. Do not improvise a mutation to force a match.

## Acceptance and exit evidence

- Record exact CLO build, visible loaded-project context, complete allowlisted helper source/hash, raw JSON/hash, query success/errors, geometry identities/indexes, source coordinate transforms, and match residuals.
- State whether CUT and internal SEW geometry are uniquely distinguishable from the exact output; this is identity evidence only and cannot clear any contour or CAD gate.
- Update the current gate matrix only if the evidence materially changes a V03 gate; otherwise preserve all gate dispositions and holds.
- Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the board through the validated command layer. Run focused packet/analyzer and Control Center checks plus `git diff --check`; no production code or global coverage change is expected.

## Delegation and next decision

No independent agent is needed for the exact-runtime read-only query. Codex owns runtime execution, source matching, and closeout. If geometry uniquely confirms the selected-path identity, bring the exact mapping and a separate verification plan before any grade edit. S605 itself does not authorize a grading mutation.
