# EPIC-17 / G04 V03 — CLO semantic attribute audit — Slice 539 start

## Verified start

- Started `2026-10-08 21:44:50 UTC` from clean S538 commit
  `c2905f36a564c2004d8def74eed3d75e9ab9d9e9` on `codex/epic-17-g04`.
  Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  still an ancestor of HEAD.
- Highest assigned slice is S538; reserve unique S539. Board revision 3267:
  EPIC-17 and G04-V03 In Progress; V01/V02 Done. Goal active.
- The maintainer-confirmed CLO trial-use and local-processing basis is settled
  per S538. CLO remains open. No new app import/export is in scope here.

## Objective and scope

Reanalyze the seven hash-pinned CLO generation-two DXF outputs already used by
S525. For each source CUT and SEW outline that S525 maps by exact geometry to a
receiver piece, compare DXF entity attributes beyond numeric layer: entity
type, line type, color/true color, lineweight, visibility, flags, extrusion,
and any per-vertex layer overrides. Determine whether a stable, all-seven
property contract distinguishes CUT from SEW where both share output layer
8. Retain source/receiver file hashes and the exact observed profile cohort.

This is a read-only analysis of existing files. New derived analysis output,
if any, must stay under `C:\\G04-CLO-DXF-Exchange\\S539-clo-semantic-attribute-audit`.
Do not open or interact with CLO, repeat imports/exports, alter DXF files,
interpret numeric layer numbers as meanings without explicit source support,
or infer industrial conformance from observed correlations.

## Acceptance and gates

- Validate all seven source and receiver hashes against S525's pinned audit.
- Reproduce same-geometry CUT/SEW associations at the existing 0.001 cm
  tolerance and record the properties for each matching receiver entity.
- Report whether any property distinguishes the shared-layer entities
  consistently across the AAMA and ASTM cohorts; a merely observed correlation
  must be labeled empirical, not a normative apparel-CAD rule.
- Preserve the five known Polo CUT contour failures, source marks without
  direct geometric matches, malformed-input result, grading/receiver/profile
  uncertainty, all V03 gates, legacy DXF behavior, and protected output bytes.

## Verification and delegation

This analysis is tightly coupled to the same source/output hashes and prior
matching method; no safe disjoint delegation is available. Run syntax checks,
determinism/hash assertions, validate the board through its command layer, run
the focused Control Center suite, and inspect the generated report. No
production code changes; no changed-code coverage or full repository gate is
due.
