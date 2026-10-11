# EPIC-17 / G04 V03 — CLO 2026.1.310 read-only outline API smoke — Slice 578 start

- Started: 2026-10-09 04:56:39 UTC.
- Branch: `codex/epic-17-g04`; start commit `0826323eae2f360af393e66ae8d9e07a35e1ffaa` (S577); worktree clean.
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor of HEAD.
- Canonical board revision 3425: EPIC-17 In Progress, G04-V02 Done, G04-V03 In Progress.
- Highest assigned slice 577; reserve unique slice 578.
- Goal inspected: active and aligned to EPIC-17/G04 through safe merge.
- Usage: ordinary work allowed; primary 4%, weekly 68% used.
- CLO product-development use and local-only handling were confirmed in writing; no further confirmation is needed.

## Objective

In the already-running CLO 2026.1.310 session, test the documented read-only getters `GetPatternCount()`, `GetPatternPieceName(index)`, and `GetPatternOutlinePoints(index)` against the currently open, hash-pinned Polo project. Determine only whether these getters exist at runtime and what they return for pattern names/count/boundary points. Save only the returned API evidence under `C:\G04-CLO-DXF-Exchange\S578-clo-outline-api-smoke\Evidence`.

## Safe execution limits

- First identify exactly one existing CLO window from the computer-use app inventory; do not launch, close, or restart CLO.
- Use only the three documented getters; no setters, mutations, export/import actions, project save, guessed enums, project-internal decoding, or unrelated app operations.
- Save the script and API output only beneath `C:\G04-CLO-DXF-Exchange\S578-clo-outline-api-smoke\Scripts` and `...\Evidence` respectively. Do not upload data.
- If the script interface or target state is ambiguous, stop the UI action, preserve the exact observed limitation, and continue with non-UI evidence work.
- Returned outline points may be insufficient: official docs say they exclude curve control points and do not guarantee separate CUT/SEW identity. Do not infer more than the observed payload establishes.

## Acceptance / non-goals

This slice passes if it records a reproducible exact-build runtime result (successful getter response or concrete app/API error) and explains whether the result can compare the hash-pinned source CUT/SEW contours within the unchanged 0.001 cm tolerance. It does not accept DXF compatibility or clear any V03 technical gate unless the evidence actually supports those criteria.

Keep V02-before-V03, all-seven V02, representative fixture/round-trip, rights, legacy DXF, protected byte identities, and 0.001 cm geometry acceptance unchanged. No production code, source pattern/stitches, compatibility claim, factory acceptance, physical fit, or production-readiness claim. No CLO project save.

## Verification and ownership

No safe independent delegation for this single live-window observation and exact-build query. Codex owns execution/review. Review the script before execution and inspect the actual returned evidence. Use only focused checks for script safety/output structure, board command preflight/replay, `npm run control-center:test`, and `git diff --check`; do not run the full repository gate for this research/tooling-only slice.

## Exit requirements

Record the exact CLO build/window state; script hash; getter availability/errors; count, names and point data or summary; whether the payload can distinguish CUT/SEW and satisfy 0.001 cm; untouched project status if observable; all remaining V03 gates; board start/exit revisions; and separate elapsed time for inspection/execution, focused verification, external-agent waits, and maintainer decisions. Preserve all claims fail-closed. Next action must follow from concrete runtime evidence.
