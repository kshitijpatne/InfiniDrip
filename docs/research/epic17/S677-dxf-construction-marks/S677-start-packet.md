# EPIC-17 / G04 V03 — recipe construction marks in additive DXF — S677 start

## Verified boundary

- Started 2026-10-10 17:37:56 UTC from clean S676 commit `4e84263395a357978a97b46a1ca208921e65a5de` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S676 is the highest assigned slice; S677 is unique.
- Canonical Control Center board revision 4021 has EPIC-17 and G04-V03 In Progress; V01/V02 are Done. S676 start/exit evidence is linked.
- Current V03 route remains unqualified. S677 does not repeat a receiver/mode/software comparison and passes no receiver or overall V03 gate.

## Source finding

The production legacy DXF exporter `src/export/dxf.ts` receives only pieces and allowances. It serializes each piece's `Piece.marks`, but not recipe-owned `GarmentRecipe.notches`. Those recipe rules also define each piece's grainline. `src/export/svg.ts` resolves and renders both using `resolveNotch`/`resolveGrainline`; the DXF path has no such input. This is a product-owned source gap, not a receiver observation. It affects the required visible manufacturing marks for all seven recipes.

## Scope and acceptance

Extend only the opt-in centimeter-declared DXF candidate to accept recipe notch/grainline rules and serialize those exact resolved marks as `MARK_NOTCH` and `MARK_GRAINLINE` LINE entities in the same laid-out centimeter coordinate system. Reuse the live pattern rules, preserve y-axis inversion and layout translation, and fail closed when a supplied recipe mark names a missing/ambiguous piece or edge. The candidate with no mark rules must remain exactly the S676 header plus the legacy stream. `exportDxf` and all existing default/UI paths remain byte-identical and unchanged.

Verify all seven current recipes at the representative base size, including per-piece mark counts and source-derived coordinates, focused tests with 100% statement/branch/function/line coverage for changed production code, protected DXF regressions, build, Control Center checks, and diff check. Retain deterministic parsed/output evidence. Do not change cut/sew geometry, tolerances, mark rules, grades, accepted V02 state, V03 gates, export baselines, receiver claims, or the default UI export.

## Non-goals and open gates

This does not add stable piece/revision IDs, grade/seam sidecar binding, receiver import/export behavior, malformed-file parsing, repeatability evidence, all-option round trips, or an industrial profile. V03 remains In Progress and incomplete. Existing CLO/DGS/OpenCAD/LibreCAD observations remain empirical and do not establish standards conformance. No software acquisition or user input is needed for this source-only change.

## Exit ledger

Implementation, focused verification, rendered/output inspection, board/docs closeout, external-agent wait, and maintainer-decision time will be recorded separately at exit. No independent low-risk task has disjoint ownership; Codex retains integration.
