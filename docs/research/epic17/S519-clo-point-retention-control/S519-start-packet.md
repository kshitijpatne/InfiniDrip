# EPIC-17 / G04 V03 — CLO source-point retention control — Slice 519 start

## Goal and boundary

Find out whether CLO documents a specific import/export control that should
preserve source contour vertices, and whether that exact control was already
ruled out by S503/S516. This is a narrow follow-up to the measured five-point
failure, not another general CAD survey or repeated import/export matrix.

Start: `2026-10-08 18:40:10 UTC`, from S518 commit
`7b20f20` on `codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S518 is the highest
assigned slice; S519 is reserved. Canonical board revision is 3187 and
G04-V03 remains In Progress. Primary usage is 0%; ordinary usage is available.

## Evidence already established

- S503 tested DXF-AAMA and DXF-ASTM import × Optimize All Curve Points off/on,
  with a fixed ASTM export. All four outputs had the same five CUT contours
  lose one vertex. Optimization-on separately reduced four button-placket
  mark loops from 12 to 8 vertices.
- S516 observed the CLO AAMA import/export/re-import settings and measured the
  same five CUT losses against the unchanged 0.001 cm gate.
- S518 saved the imported state before export, but the exact contours inside
  its proprietary `.pac` payload were not readable with the safe local parser.
  No duplicate export was run. The app remains open; do not close/relaunch or
  repeat its import matrix.

## Work and conditional action

1. Read the exact official CLO help/API sources for import/export point or
   curve controls that are visible in the tested dialogs, focusing on the
   previously unchecked `Import Draw Curve Points (When curve is not loaded)`
   option and documented export-side contour simplification. Record what each
   option actually means, the applicable CLO build, and whether source points
   are in its documented purpose.
2. Reconcile those definitions with the S503 cells and S516 settings. Do not
   count controls with no documented relation to point preservation as
   evidence-backed hypotheses.
3. A primary CLO support answer recommends checking `Import Draw Curve Points`
   when a DXF pattern is incomplete. It does not claim exact vertex fidelity,
   but it makes this one previously untested option a relevant, bounded
   hypothesis. The pinned source contains 18 `POLYLINE` entities and 610
   `VERTEX` records, with no `SPLINE` or `LWPOLYLINE`; this is not an obvious
   Bezier/SPLINE conversion case. Run one isolated test in the already-running
   session with only `Import Draw Curve Points` enabled. Keep AAMA profile,
   centimeters, 100%, orientation, grain and all other settings fixed. Export
   once as AAMA only if the import dialog visibly exposes the option and it
   can be checked. Compare source piece/block identity and the same five CUT
   paths against 0.001 cm. Do not reimport or run another cell unless that
   first output clears all five and the exchange-relevant piece checks.
4. Keep all files under the fresh
   `C:\G04-CLO-DXF-Exchange\S519-clo-point-retention-control\` folder. User
   has already authorized practical local CLO trial use; do not upload, spend,
   change the account, or install anything. If the live control is absent or
   the one output still fails, preserve the evidence and stop the CLO branch;
   do not try adjacent settings by trial and error.

## Gates and non-goals

- Keep the exact 0.001 cm geometry gate, all-seven recipes, rights/profile
  qualification, grades, marks/layers, negative-control, industrial profile
  and round-trip gates unchanged. Preserve legacy DXF behavior and every
  protected export byte identity.
- This does not authorize smoothing/reconstructing source contours, moving
  points, changing fixtures, or claiming CLO is generally unsuitable. Any
  one-cell test is limited to the identified CLO build, setting and fixture.
- No production code or export baseline change is in scope. No full repository
  coverage/build gate applies unless behavior changes; focused analysis and
  Control Center gates remain required.
- No safe independent ownership split exists: this is a small coupled read of
  exact prior findings plus the live receiver control semantics. Codex retains
  ownership; no external-agent wait is planned.

## Start-board evidence

`S519-start-board-commands.json` records the bounded slice on G04-V03 through
the validated command layer. The preflight starts from committed board state;
replay writes the canonical board. Update project state, context index and
board only after the verified slice result is ready.
