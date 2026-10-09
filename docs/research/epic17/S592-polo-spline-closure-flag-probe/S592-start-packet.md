# EPIC-17 / G04 V03 — Polo SPLINE closure-flag probe — Slice 592 start

## Verified start and authority

- Started `2026-10-09 07:51:42 UTC` on `codex/epic-17-g04` from committed
  S591 `f8c45b1a83dfc8052120710a505f1bc69ab9b8e7`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  S591 and S590 are the latest 590-series slice commits; S592 is unique.
- S591 closed at board revision `3485`; EPIC-17 and G04-V03 remain In
  Progress; G04-V02 remains Done. The S591 goal audit reports `active`, and
  the goal objective matches the admitted EPIC through safe merge.
- The maintainer's written product-development trial and local-file handling
  authorization is settled. Keep this exchange's files in the named C: folder;
  no additional permission input is needed. Keep the existing CLO session open.

## Bounded question

S591's closed planar linear SPLINE test produced five large CUT deviations
despite mathematically exact degree-1 control points. S592 changes exactly one
DXF property on those five CUT entities: group 70 flag `25` (closed + planar +
linear) becomes `24` (planar + linear), while the repeated first control point,
clamped knots, coordinates, every other entity and all other pairs stay fixed.
The repeated terminal point still makes the represented piecewise-linear path
geometrically closed. This isolates the entity closed-bit interpretation; it
does not assume how CLO reads that flag.

## Stop conditions and acceptance

1. Hash-check the committed S591 DXF fixture. Create a C:-only derivative that
   changes only the five target `70=25` flags to `70=24`, prove all other DXF
   group/value pairs are identical, and assert exact source-coordinate
   controls and repeated endpoints remain. Source deviation must remain
   exactly zero, below the fixed `0.001 cm` gate.
2. Do not import if that preflight fails. If it passes, use one clean CLO
   project for a single import, render and DXF-AAMA export at the exact S536/
   S591 settings. Stop if CLO rejects the input, does not show nine pieces, or
   changes unrelated geometry. Do not perform a second-generation import.
3. Pass only if all nine CUT and nine SEW contours have an unambiguous piece
   binding and conservative symmetric-distance upper bounds at or below
   `0.001 cm`. A successful UI import/export or render alone is insufficient.

This is one bounded encoding diagnosis. It cannot change V03 acceptance,
all-seven scope, CLO profile identity, source/stitch geometry, product/legacy
DXF behavior, protected export identities, or any V02 hold. No physical-fit,
factory-acceptance, AAMA-conformance, universal-format or production-readiness
claim is in scope.

## Verification and work ownership

Codex owns the single controlled fixture/UI/output comparison. No independent
low-risk task has disjoint ownership. Record source/fixture/output hashes,
visible import/export settings, actual rendered evidence, 9-piece count,
per-piece CUT/SEW measurement, board replay, 42 focused Control Center tests,
`node --check`, and `git diff --check`. Production-code coverage is not
applicable if only diagnostic fixtures/docs change; preserve the full-repo
gate for the settled Epic/PR candidate.

The validated start board commands add `E-G04-S592-START` and the scope
comment at revision `3485→3487`, without changing Epic/V02/V03 statuses.
