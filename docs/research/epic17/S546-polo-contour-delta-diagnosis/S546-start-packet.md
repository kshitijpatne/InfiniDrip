# EPIC-17 / G04 V03 — Polo first-cycle contour delta diagnosis — Slice 546 start

## Verified start

- Started `2026-10-08 22:38:29 UTC` from clean commit
  `e9edce65e3d687f84218ca0c4c80ee37b285a70a` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
  ancestor. S545 is the highest assigned slice; reserve S546.
- Board revision 3295; G04-V03 remains In Progress. The G04 goal record is
  active and still needed. Working tree was clean.
- Use S545's C:-only exact Polo M/default source, gen1/gen2 outputs, saved
  comparison, and CLO 2026.1.310 session. No file is to be copied to any other
  drive or sent to a hosted CLO service.

## Objective and bounded method

Resolve the five known Polo CUT contour residuals before considering any
receiver setting change. They are source contour ordinals 2, 10, 12, 14 and
16; each exceeds the fixed 0.001 cm screen by 0.0127–0.0140 cm in both CLO
generations and has one fewer output vertex. Use the exact source and output
paths to identify affected path regions and record source/output overlays or
coordinates. Compare the same contours in gen1 and gen2 to establish whether
the movement repeats or accumulates. Reinspect prior S495/S498/S500/S516
evidence to avoid rerunning resolved tests.

Keep the CLO import/export profile unchanged during this diagnosis. Do not
alter geometry, the stitch graph, settings, tolerances or V03 acceptance. If a
native project snapshot cannot expose the intermediate imported geometry,
record that limitation and propose a single next experiment tied to the exact
path difference; do not guess a cause or widen the test matrix.

## Gates, exclusions, handoff

- Preserve the 0.001 cm gate and all V03 requirements: exact receiver/profile
  and rights evidence, all seven recipes, geometry/units, semantics/labels/
  marks/grade behavior, negative inputs, and documented re-import/round-trip.
- No product implementation, pattern/cut geometry change, export identity
  change, commercial compatibility claim, fit/factory claim, or setting trial
  in S546.
- This is a focused evidence-only diagnosis with no safe delegation: it shares
  the live CLO session, pinned fixture, and contour evidence. No external-agent
  wait is expected; Codex reviews all geometry and rendered results.
- All new files and any CLO project/overlay/render evidence must remain below
  `C:\\G04-CLO-DXF-Exchange\\S546-polo-contour-delta-diagnosis`.

## Exit boundary

Record the exact path segments/landmarks, measured source-to-gen1 and
gen1-to-gen2 deltas, generated C:-only evidence hashes, whether intermediate
import geometry was recoverable, focused diagnostics and canonical board
replay. Preserve the V03 hold and identify one next action. No full repository
gate is due for this research-only slice.
