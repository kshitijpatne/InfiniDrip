# EPIC-17 / G04 V03 — Polo CUT vertex-loss adjacency diagnosis — Slice 613 start

## Verified start and objective

- Started 2026-10-09 11:49:29 UTC on `codex/epic-17-g04` from
  `cc8bc9cf24e862d78c5c23ffd2504a326a1d1f77` (S612 closeout). Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor;
  tree was clean. Board revision 3582 shows EPIC-17/G04-V03 In Progress and
  G04-V02 Done. S612 is highest, so S613 is reserved.
- CLO is still unavailable through this runtime's native app controls. S613
  is strictly offline and uses only the already authorized, hash-pinned S609
  source and actual CLO AAMA/ASTM outputs in
  `C:\G04-CLO-DXF-Exchange\`. It does not reopen CLO, change any app, or
  touch a source/import/export file.
- Objective: locate the exact source vertex absent from each of the same five
  failed Polo CUT contours (back, outer/inner stand, upper/under collar),
  measure its incident edge lengths and turn/deflection, and compare the
  AAMA and ASTM outputs. Decide whether a common source-geometry simplification
  mechanism is supported strongly enough to justify any further profile test.
  The analysis is diagnostic, not a proposed geometry repair.

## Scope and gates

- Hash-pin the S609 source and ASTM output plus the existing S536 AAMA output;
  bind exact contours using the prior same-piece map/block identities. Match
  source vertices to emitted closed CUT geometry and report source indices,
  nearest residuals, adjacent lengths, and local angles for the omitted
  vertex, preserving units and transforms.
- Cross-check all five against S610's conservative source-bound failures and
  the existing `0.001 cm` gate. Report ambiguities or failed correspondence
  explicitly; do not infer CLO's internal processing stage or assign meaning
  to numeric output layers.
- Do not change source geometry, the legacy writer/baselines, V03 acceptance,
  tolerances, profile, protected export identities, or any hold. No V03 gate
  can pass from this offline comparison alone. No product implementation,
  CLO UI operation, physical-fit or factory claim.
- Deliver a hash-pinned report only under
  `C:\G04-CLO-DXF-Exchange\S613-polo-cut-vertex-adjacency\Evidence\`;
  script/preflight/board packet live in this bounded research folder.
- No safe independent ownership split for a compact source-to-output contour
  matcher. Codex owns analysis and review.

## Single next action

Run the read-only contour matcher on the three pinned C: artifacts. If the
missing vertices do not map uniquely, stop with an ambiguity report. If they
do, use the measured neighborhood to state whether source-geometry
simplification is plausible, still unproven, or contradicted, and select the
next evidence-backed V03 action without a speculative encoding trial.
