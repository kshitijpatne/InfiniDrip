# EPIC-17 / G04 V03 — Explicit DXF unit-header diagnostic — Slice 617 start

## Verified state and scope

- Started 2026-10-09 12:43:36 UTC after S616 commit `2f1155de` on
  `codex/epic-17-g04`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  S616 is the highest assigned slice; reserve S617. Worktree is clean before
  this packet. Canonical board revision is 3601; EPIC-17/G04-V03 are In
  Progress and G04-V02 is Done. S616 exit packet and current matrix are under
  `docs/research/epic17/S616-standard-dxf-units-sensitivity/`.
- S614–S616 imported the same unitless source to CLO using Standard DXF. The
  output stayed 0.1× after both cm/mm selector choices and 100%/1000% scale;
  S609 showed a distinct AAMA path imports/exports without scale loss but still
  has five CUT failures. The production DXF writer emits true-centimeter
  coordinates but no HEADER/$INSUNITS (`src/export/dxf.ts`); the pinned Polo M
  source likewise declares neither `$INSUNITS` nor `$MEASUREMENT`. S536 tested
  a geometry-preserving R2000 variant with `$INSUNITS=4` only through AAMA,
  not Standard DXF. This makes explicit centimeter metadata on the Standard
  path a bounded, previously untested hypothesis.

## Controlled trial

Use the same source bytes and exact S614–S616 Standard-DXF import options,
including centimeters and 100% scale, except add an AC1015 HEADER containing
`$ACADVER=AC1015` and `$INSUNITS=5` (centimeters) to a disposable C:-only
diagnostic copy. Preserve every original entity, vertex, layer and coordinate
sequence. Use the established ASTM Graded Nest export setup, re-import that
output once, and inspect the actual render. Store derivative, preflight,
round-trip, analysis, screenshots, and CLO scene under
`C:\G04-CLO-DXF-Exchange\S617-standard-dxf-units-header\` only. Do not edit or
overwrite the product writer, source fixture, any baseline, or saved prior
trial.

Measure source-bound piece identity and every CUT/SEW contour at the unchanged
`0.001 cm` threshold, dimensions/unit scale, layer inventory, available marks,
rendered detail, import/export notices, and errors. A successful menu operation
or nine rendered shapes is not a pass. If header-aware import produces correct
true-scale geometry, this fixture may clear only its measured geometry path;
all-seven coverage, profile rights/edition, roles/marks, grades/options,
negative inputs, repeated exchange, and useful render gates remain. If it has
no effect or damages geometry/identity, record that result and stop testing
unit-setting permutations on this fixture.

## Acceptance boundaries and verification

- Research-only; no production source, pattern, stitch graph, output baseline,
  geometry threshold, or product behavior changes. Preserve all-seven recipe
  acceptance, V02-before-V03, legacy DXF behavior, and protected export byte
  identities. Keep every V03 hold until evidence proves its exact criterion.
- Rights and local-processing confirmation for this CLO product-development
  evaluation are already recorded; do not re-ask. Keep CLO open throughout
  active G04 work. No physical-fit, factory-acceptance, supplier, launch, or
  production-readiness claim.
- Codex owns the controlled GUI work. No safe disjoint delegation exists.
  Inspect derivative preflight, hash-pin all evidence, inspect the rendered
  re-import, run the source-bound analysis and `node --check`, validated board
  preflight/replay, focused Control Center tests, and `git diff --check`. No
  product code changes; changed-code coverage is not applicable. Full repo
  tests/coverage remains for the settled Epic/PR candidate.
- S616's separate time ledger reports about four minutes for CLO
  setup/exchange and three minutes for analysis/closeout; external-agent waits
  and maintainer-decision time were zero. Track S617 implementation, focused
  verification, agent waits, and maintainer-decision time separately at exit.

## Single next action

Create and hash-pin a derivative that adds only truthful `$INSUNITS=5`
centimeter metadata to the unchanged Polo M DXF, then run one controlled
Standard-DXF import/export/re-import trial with all other settings fixed.
