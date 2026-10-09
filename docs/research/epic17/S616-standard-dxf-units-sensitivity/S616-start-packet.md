# EPIC-17 / G04 V03 — Standard-DXF unit-selector sensitivity — Slice 616 start

## Verified state and objective

- Start 2026-10-09 12:32 UTC on `codex/epic-17-g04` at S615 commit
  `083f11f55b8aacc401473cbccc5bc6868d572958`. Fetched `origin`; its current
  `main` remains `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the
  candidate. S615 is the highest assigned slice; reserve S616. The worktree
  was clean. Board revision is 3596, with EPIC-17/G04-V03 In Progress and
  G04-V02 Done.
- S614 and S615 both emitted geometry at 0.1× source size; S615's 1000% scale
  setting did not change geometry. The same source DXF has no `$INSUNITS` or
  `$MEASUREMENT` header variable. S616 isolates whether CLO's input-unit
  selector changes the outcome.

## Controlled method

Use the same Polo M source at
`C:\G04-CLO-DXF-Exchange\S616-standard-dxf-units-sensitivity\Input\polo-standard-m.dxf`,
SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
In the same CLO 2026.1.310 build, select Standard DXF, change only Unit from
Centimeter to Millimeter, and keep scale at 100%, rotation, grain, notch/curve
options, ASTM Graded Nest export options, and `0.001 cm` geometry gate fixed
to S614. Import to a blank disposable scene, export once, then re-import the
exact output using the same unit-selector settings; hash-pin output, scene and
render. Keep all input/output/evidence files inside the named S616 C: folder.

## Acceptance, non-goals, and stop conditions

- This is one receiver-parameter diagnostic, not a proposed product default,
  profile qualification, or V03 acceptance. Record actual front dimensions,
  all nine piece identities/bounds, CUT/SEW geometry correspondence, vertex
  changes, errors/notices, and rendered visibility/readability.
- A geometry pass requires exact source piece binding and all applicable
  contours within the unchanged `0.001 cm` gate in source scale. A menu
  operation/re-import alone is not a pass. If output binding is ambiguous,
  stop with the ambiguity and preserve the V03 hold.
- Do not change source/cut geometry, pattern source, product code, export
  baselines, acceptance criteria, or protected identities. Do not rescale
  output after export or claim exact-format compatibility from GUI labels.
  No physical fit, supplier, factory-acceptance, launch, or readiness claim.
  Keep all seven recipes and every existing V03 hold.

## Verification and ownership

- Codex owns this bounded CLO trial and integrated review. No independent,
  disjoint, low-risk delegation exists; no external agent assigned.
- Run the exact source-bound scale/contour analyzer, capture and inspect the
  real CLO re-import rendering, validate the board packet and run focused
  Control Center checks plus `git diff --check`. No product code changes;
  changed-code coverage is not applicable. Run full repository tests/coverage
  once on the settled Epic/PR candidate. Leave CLO open.
- Start evidence is `E-G04-S616-START`; board replay `3596→3598`. No gate or
  status is cleared at start.

## Single next action

Open the hash-pinned input in a blank CLO scene as Standard DXF with Unit set
to Millimeter and scale at 100%, holding every other setting fixed.
