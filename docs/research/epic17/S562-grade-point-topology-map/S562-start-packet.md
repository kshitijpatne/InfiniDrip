# EPIC-17 / G04 V03 — Source grade-point topology map — Slice 562 start

- Started: 2026-10-09 00:32:02 UTC.
- Start commit: S561 `5dc8b34`; branch `codex/epic-17-g04`.
- `origin/main` was refreshed in S561 and remains an ancestor; refresh and
  recheck ancestry before the slice commit.
- Board start revision 3361; S561 is latest; reserve S562. V01/V02 Done; V03
  In Progress. Usage at start: primary 12%, ordinary use available.
- CLO 2026.1.310 stays open. DXF-ASTM is the documented candidate, but its
  visible/accessibility UI state conflicted in S561. All exchange files and
  captures remain under
  `C:\G04-CLO-DXF-Exchange\S562-grade-point-topology-map`.

## Scope

Read current pattern-generation and grading source, the S559 35-file fixture
manifest, and actual per-size geometry to determine whether product grade-run
values can be mapped unambiguously to pattern point IDs for a representative
recipe without changing source geometry. Report topology/point-count
stability, point correspondence, size labels, grade deltas, and any piece,
option, or construction-role exceptions. Establish whether the current CLO
API route can use those facts, without calling mismatched/unverified API
methods or inventing a file format.

## Acceptance and holds

- Preserve the all-seven V03 acceptance, grade/option proof, exact geometry
  tolerance, source geometry, legacy DXF bytes, and protected export identities.
- Do not author a DXF-ASTM file, guessed `.RUL`, or production exporter.
- Do not mutate CLO or create/export files until point mapping and target build
  support are established and the visible/accessibility state agrees.
- Keep every V03 hold and product claim unchanged.

## Exit evidence

Produce a deterministic source-bound topology mapping or document the exact
ambiguity that prevents one. Name the best representative test fixture and
all measurable invariants; identify the next single gate. Record focused
validation, board replay, and elapsed time by category. No safe disjoint task
is assumed; delegation must be reconsidered only if a bounded independent
piece appears.
