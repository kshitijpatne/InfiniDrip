# EPIC-17 / G04 V03 — Polo CUT segmented-LINE import trial — Slice 640 start

## Exit-audit correction

The initial start packet's claim that connected LINE entities were an
untested representation was incorrect: S620/S621 tested DXF-AAMA and S622
tested Standard DXF on the S574 Polo connected-LINE fixture. That prior-art
gap was found during closeout and is recorded in S640's exit packet and board
comment. S640 therefore records a narrower subset-isolation attempt within
the previously tested LINE family, not a new entity family or profile route.
Do not repeat connected-LINE import tests on this fixture.

## Verified boundary

- Started `2026-10-09 22:02:35 UTC` on `codex/epic-17-g04` at committed S639
  `be7b7d6a8df0cfa48146d19879a6b2fa6ca1504d`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor and
  the worktree was clean. S639 is the highest assigned slice; reserve S640
  exactly once.
- Canonical Control Center board revision 3701 has G04-V01/V02 Done and
  G04-V03/EPIC-17 In Progress. S639's linked exit packet records the active
  goal, unchanged V03 criteria, and no cleared V03 gate.
- The already authorized CLO 2026.1.310 trial is available for local
  product-development DXF evaluation. Continue the existing application
  session; never relaunch/close it while G04 remains active. Put all CAD
  inputs, outputs, projects and renders only under
  `C:\G04-CLO-DXF-Exchange\S640-polo-cut-segmented-line-import\`.

## Evidence-led hypothesis

The five remaining same-source Polo M CUT failures trace to shallow-turn
corners where one edge is only `0.045618–0.046957 cm` long; joining the
neighbors changes the contour by `0.012736–0.013970 cm`, versus the fixed
`0.001 cm` gate. S619 found the same five points already absent in the CLO
native representation. S617 Standard-DXF/AAMA-header, S632 ASTM import,
S635 Standard-DXF/LWPOLYLINE, and S636 ASTM/LWPOLYLINE have already measured
the same five failures. Do not repeat those formats, units, settings, or
POLYLINE/LWPOLYLINE permutations.

One materially different DXF representation remains untested: encode only
the five failed closed CUT contours as explicit, connected straight `LINE`
entities on their existing `CUT` layer, retaining every source vertex and
coordinate in order. Hypothesis: if CLO preserves separate straight edges
as supplied, this representation may retain each shallow-turn corner without
editing garment geometry. This is a test of the receiver's handling of the
entity type and grouped contour; it is not an assertion that the receiver
will reassemble separate lines or that CLO has an internal simplification
threshold.

## Exact source and controlled procedure

Use the existing hash-pinned S617 centimeter-header source:

- Path: `C:\G04-CLO-DXF-Exchange\S617-standard-dxf-units-header\Input\polo-standard-m-cm-units-header.dxf`
- Expected SHA-256: `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`
- Expected length: 24,326 bytes; header declares AC1015 and `$INSUNITS=5`.
- Five target contours: `back`, outer/inner collar stand, upper/lower collar.
  Source vertices are the S634-traced short-edge corners: P13 on back and P14
  on each collar piece. All other CUT contours are unchanged controls.

1. Copy the pinned source into the named S640 C: folder. Preflight one
   derivative: replace only those five closed `CUT` POLYLINE entities by
   their ordered `LINE` segments, including the closing segment. Keep every
   coordinate, piece order, source unit/header, SEW entity, mark, layer and
   unrelated DXF record unchanged. Do not discard widths, bulges, elevation,
   handles or metadata: if a target polyline has unsupported non-coordinate
   content or exact conversion cannot be asserted, stop and record the reason.
2. Import the derivative once with CLO's **Standard DXF**, centimeters, 100%,
   Do Not Rotate, and the same S617 import settings for grain, grading,
   curve-points, optimization, non-grading-point removal, notches and seam
   allowances. Change no other option.
3. Before any export, require all nine source piece identities and all nine
   CUT plus nine SEW contours to map uniquely and meet `0.001 cm`. Review the
   five affected contours in actual rendered detail. If a piece fragments,
   joins ambiguously, loses a mark, fails geometry or cannot be read, stop
   before export; preserve the exact failure and keep the V03 hold.
4. Only if the complete pre-export gate passes, export once as DXF-ASTM with
   S617's Graded Nest / cm / 100% / Do Not Rotate settings, reimport that
   output once using DXF-ASTM, and compare identities, CUT/SEW geometry,
   marks/layers, grades/options, and rendered detail. A successful UI action
   or nine visible silhouettes alone is not a pass.

## Acceptance, holds and non-goals

- This tests exactly one entity-representation hypothesis, on one existing
  Polo M revision. Keep the unchanged `0.001 cm` limit, all-seven recipe and
  supported-option V03 scope, documented profile/rights selection, stable
  identities, exact geometry/marks/layers, grade behavior, malformed-input
  rejection, repeated exchange and readable output gates. This fixture can
  clear only evidence it actually measures.
- Keep V01/V02 Done and V03/EPIC-17 In Progress. Preserve all existing holds,
  source geometry, stitches, legacy DXF behavior, protected export byte
  identities, and every admitted non-goal. No new standard claim follows from
  Standard-DXF or DXF-ASTM menu labels. No physical, factory, or
  production-readiness claim.
- No source or product-code change is planned. No safe disjoint task exists:
  this one variable must be coupled to the live receiver import and the same
  source-bound rendered inspection, so Codex owns the experiment.

## Verification and exit evidence

- Hash-pin the original input, exact derivative, preflight manifest, CLO
  native project/query, contour analyzer, actual render, conditional export
  and reimport, and output comparison under the named C: folder.
- Run syntax and exact-change preflight before opening the derivative in CLO;
  run source-bound comparison, focused Control Center tests, validated board
  replay, and `git diff --check` at closeout. If no production code changes,
  changed-production-code coverage does not apply. Full repository tests and
  100% coverage/build/browser/output review remain for the settled Epic/PR.
- Track actual implementation/UI time, focused verification, external-agent
  waits and maintainer-decision time separately.

## Single next action

Create the five-contour LINE-only derivative, prove it contains the exact
source CUT geometry and no unrelated changes, then run one verified CLO
Standard-DXF import and source-bound pre-export inspection. Stop at the first
failed identity, geometry, join, or readable-output check.
