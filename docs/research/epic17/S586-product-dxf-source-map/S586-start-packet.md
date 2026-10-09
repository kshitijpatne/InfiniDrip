# EPIC-17 / G04 V03 — Product DXF source map — Slice 586 start

## Verified start

- Started 2026-10-09 06:15:19 UTC from S585 commit
  `4befb327bc027d8573b578fe1f696796af7c9bb0` on `codex/epic-17-g04`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. The worktree was clean before this packet.
- Canonical Control Center revision 3457: EPIC-17/G04-V03 In Progress,
  G04-V01/V02 Done. S585 is the highest assigned slice; S586 is unique.
- Goal remains active and matches the admitted G04 objective. Ordinary usage
  is available (primary 17%, weekly 71%).
- The maintainer's written product-development and local-processing
  authorization remains settled. CLO 2026.1.310 stays open, but no CLO
  operation is admitted in this slice.

## Objective

Audit the product's existing DXF writer and seven hash-pinned M/default recipe
outputs against S573's remaining V03 gate matrix. Map source piece and revision
identity, cut and sew contours, marks, units/scale, output layers/entities,
size/grade content, and the evidence available to validate each mapping.
Prioritize the concrete CLO Polo CUT failures and the S557 seven-output
semantic/mark findings. Determine whether a source-side representation defect
is directly demonstrated and whether it can be addressed by a separate
professional-profile path without changing the legacy writer or its protected
byte identities.

## Scope and boundaries

- Read the existing `src/export/dxf.ts`, pattern-mark writer, recipe/export
  types, relevant tests, pinned S557/S573 reports, and their seven C:-only
  output fixtures. Verify each retained artifact hash before parsing it.
- Build a source-to-output mapping table for each of the seven M/default
  fixtures. Separate directly encoded source data, observed DXF entities, and
  conclusions that remain unproven because the profile semantics are unknown.
- Use read-only parsing/reports and rendered/output evidence already present.
  No source edit, production/test change, DXF regeneration, baseline move, CLO
  operation, or new receiver search is in scope.
- Preserve legacy DXF behavior and protected export bytes; all V03 geometry,
  piece/revision identity, semantic marks/layers, grade/options,
  malformed-input, round-trip, rendered output, and all-seven criteria; the
  0.001 cm geometry threshold; V02 Done and the V02-before-V03 order.
- Do not infer manufacture meaning from layer names/numbers alone, elevate
  default-size output to grade evidence, claim that a source-side defect caused
  CLO's loss without stage evidence, or make physical/factory/readiness claims.

## Exit gates

Pass this audit when each of the seven existing output fixtures is identified
by hash; actual entity/layer/unit/mark/piece facts are checked against source
and existing diagnostics; limitations are classified per S573; and one next
step follows from a specific defect or a documented absence of one. Do not
make an implementation recommendation that presumes a semantic mapping not
supported by product code or accepted profile evidence.

Create a reproducible C:-only evidence audit under
`C:\G04-CLO-DXF-Exchange\S586-product-dxf-source-map`. Repository scripts may
verify pinned hashes and parse the already-retained outputs but must not modify
them. Review actual rendered/output evidence for the relevant entities.

Run focused source/evidence assertions and `node --check` for S586 scripts,
Control Center tests (42 expected), validated board preflight/replay/status,
and `git diff --check`. No production source/tests change, so no full
coverage/build run is due until the settled Epic/PR candidate.

## Delegation and timing

This source-to-profile interpretation is a shared G04 contract decision; no
disjoint low-risk delegation is available. Codex owns the audit and any
follow-up. Start time is 2026-10-09 06:15:19 UTC. At exit, record evidence
inspection, analysis, focused verification, durable records/board, external
waits, and maintainer-decision time separately.
