# EPIC-17 / G04 V03 — Polo CUT output-topology diagnosis — Slice 593 start

## Verified start and authority

- Started `2026-10-09 08:02:55 UTC` on `codex/epic-17-g04` from committed S592
  `3b357de410cbcdccfeb232a1317a6b5b0ac2e2bc`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S592
  is the highest assigned slice on the active branch; 593 is the unique next
  number.
- Canonical board revision 3491: EPIC-17 In Progress, G04-V02 Done and
  G04-V03 In Progress. S592 closed with all five target SPLINE candidates
  rejected for the tested fixture/build/profile; all V03 gates remain.
- The current goal audit remains active and matches the admitted Epic through
  safe merge. Product-development trial use and local file handling are
  settled. Use only already saved S591/S592 files and place S593 reports in
  `C:\\G04-CLO-DXF-Exchange\\S593-polo-cut-output-topology`.

## Bounded question

S591 and S592 each preserve exact source SPLINE control sequences but CLO's
first-generation output still fails the Polo back and four collar CUT gates.
S593 determines what the actual receiver emitted without trying another
encoding or assigning an undocumented CLO cause. It examines every closed
CUT candidate within each receiver block already bound by an exact unchanged
SEW path, not just the nearest candidate chosen by the earlier analyzer.

## Scope and method

1. Verify hashes for both input fixtures, source preflight reports, CLO
   generation-one outputs, and prior per-piece reports. Reuse only the
   recorded original LWPOLYLINE baseline, S591 closed-flag input/output, and
   S592 open-flag input/output.
2. Rebind all nine output blocks using each unchanged SEW contour. For the five
   affected CUT pieces, enumerate every closed block path as an anonymous
   geometric candidate; retain layer IDs only as locators, never as CUT/SEW
   semantics. Confirm the four passing controls and all nine SEW bindings.
3. For every target/candidate pair, record vertex and segment counts, closure,
   bounding box, perimeter/area where valid, and symmetric sampled-distance
   witnesses in both directions. Map worst residuals and candidate vertices
   back to source segment/vertex neighborhoods and compare the S591 vs S592
   residual patterns.
4. Do not modify DXF inputs/outputs, pattern geometry, product code, export
   baselines or V03 gates. Do not open CLO, run another import/export, or
   generate another encoding. A possible further trial needs its own
   source-exact hypothesis and packet after this diagnosis.

## Exit evidence and gates

- All files hash-pinned; all candidates and source neighborhoods reported;
  no candidate selection relies on anonymous layer meaning or piece order.
- Analysis script passes `node --check`; measurements reproduce from saved
  inputs/outputs; focused tests and board command clone preflight/replay pass;
  Control Center remains 42/42; `git diff --check` passes.
- No production source changed, so changed-production-code coverage is N/A.
  Full repository coverage/build stays for the integrated Epic/PR candidate.
- V03 geometry remains failed on the affected Polo CUTs. Preserve all-seven
  scope and every receiver, identity, semantic, marks, grading/options,
  malformed-input, useful-detail and repeated-round-trip gate. No universal
  AAMA, physical-fit, factory-acceptance or production-readiness claim.

## Verification ownership and next action

Codex owns the read-only analysis and final review; there is no safe disjoint
delegation. If the output candidates show a clear shape/topology discrepancy,
the next action will be one evidence-bounded technical strategy decision,
not another open-ended encoding trial. If analysis cannot identify a specific
source-exact route, keep the known Polo hold and reconcile the technically
available pathways against the unchanged V03 acceptance.
