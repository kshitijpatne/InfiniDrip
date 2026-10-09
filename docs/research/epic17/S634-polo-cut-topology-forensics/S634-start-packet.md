# EPIC-17 / G04 V03 — Polo CUT-loss topology forensics — Slice 634 start

## Verified boundary and inputs

- Started `2026-10-09 19:00:15 UTC` from committed S633
  `cf367686b74b4572662d23b9cf12c459e1de4308` on
  `codex/epic-17-g04`. `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  was refreshed and remains an ancestor. The worktree was clean; slice 633
  was highest. The canonical board is revision 3676, with V01/V02 Done and
  V03/EPIC-17 In Progress. S634 is reserved as the unique next slice.
- The byte-identical S617/S632 source is
  `C:\G04-CLO-DXF-Exchange\S617-standard-dxf-units-header\Input\polo-standard-m-cm-units-header.dxf`,
  SHA-256 `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`.
- Existing CLO outputs are S617 Standard-DXF import → ASTM export
  (`polo-m-cm-header-standard-input-astm-output.dxf`, SHA-256
  `42DB6B2C7974637047BDCB39763A5E677D10B6D4A2696CE13ED837581BE46525`) and
  S632 ASTM import/export generations 1 and 2 (hashes and geometry/mark
  reports are in the S632 exit packet). All paths are existing C:-only
  evidence. No new exchange or CLO action is authorized by this packet.

## Bounded question and objective

S610 recorded the same five failing Polo CUT roles but could not isolate the
loss stage because source encoding and export format differed across its two
historic routes. S617 and S632 hold the same centimeter-header source, while
varying only CLO import mode at first export; S632 also records a second
generation. Determine, offline, whether the exact source CUT vertex/edge loss
is the same across S617 Standard-import and S632 ASTM-import outputs and both
S632 generations. Bind by same-piece geometry/identity, trace each changed
vertex to its source segment, and record whether any relevant mark or SEW
outline is coincident. Do not infer CLO's internal loss stage from output
differences alone.

## Acceptance, gates, and boundaries

- Verify SHA-256 for source, all compared DXFs, and pre-existing analyzer
  reports before parsing; confirm the S617 and S632 source copies are
  identical.
- Identify all nine pieces from their source SEW geometry/block transforms;
  analyze all five known failing CUT roles and the four passing controls.
- For each failure, report source CUT entity/vertex index and coordinate,
  adjacent source segment(s), corresponding receiver polyline and closest
  output segment, residuals, vertex-count difference, and whether each import
  mode/generation omits or shifts the same feature. State ambiguity when
  matching is not one-to-one.
- Check the existing source mark inventory and source outlines at the same
  station; do not relabel marks or use numeric output layer values as
  semantics. Preserve the `0.001 cm` acceptance threshold and report all
  values in source coordinates.
- Deliver a deterministic offline analysis report and reviewed S634 packet.
  If the evidence identifies a plausible source repair, provide an exact
  proposal and changed-geometry risk for separate maintainer approval before
  implementation. Do not edit source geometry, stitch graph, POMs, DXF writer,
  output baseline, or thresholds.
- No V03 gate may be declared passed on this Polo-only analysis. Preserve all
  seven-recipe/option/grade, profile/rights, units, identity, semantic marks,
  malformed-input, repeatability, rendered-readability, legacy-export, and
  protected-output gates.

## Non-goals, delegation, and timing

No CLO UI operation, new receiver test, standards inference, software install,
production-code change, acceptance weakening, V02/V03/Epic status change, UI
work, physical sampling, supplier contact, spending, hosting, or product-
readiness claim. No safe disjoint delegation exists: the task is a single
source-bound forensic map of a fixed small set of DXFs; Codex owns the parser,
report and review. Expected effort is one bounded offline slice. At start,
primary usage was 52% and weekly 95% (informational). CLO remains open for the
active Epic and is not used in this slice.

## Single next action

Implement one read-only DXF topology analyzer for the pinned S617/S632 files,
run it against all three output generations at the unchanged tolerance, and
review the source-edge mapping before proposing any source edit.
