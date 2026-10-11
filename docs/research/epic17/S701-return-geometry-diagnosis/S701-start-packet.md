# EPIC-17 / G04 V03 — S701 exact return-geometry diagnosis

## Verified boundary and slice

- Start: 2026-10-11 00:02 UTC (approximate; committed boundary reached after S700 closeout).
- Branch: `codex/epic-17-g04`; starting commit `c05c1a363fb6fe6316cbe3064a36e94e3f416585`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- S700 is highest assigned; reserve S701. Canonical board revision 4135: EPIC-17 In Progress, V03 held. Goal record is active and matches admitted V01→V02→V03 objective.
- Exact candidate, CLO return, normalized comparison copy and render reports are in `C:\G04-CAD-Interchange\S700-named-piece-package\`; do not rerun CLO or generate another receiver variation.

## Objective

Determine whether S700's five failing CUT residuals and three 1.4999984 cm
buttonhole-point residuals reflect actual drawing errors, receiver symbol
conversion, or a comparison-model defect. Read the precise source and returned
DXF entities and relate them to the hash-pinned S700 rendered output. Compare
only evidence already saved on C: and the current writer/comparator source.

## Required exit

1. For every affected piece, identify the exact offending CUT vertices and the
   corresponding returned segments, including position and direction of the
   0.00258–0.03293 cm misses. Distinguish source path error from receiver
   simplification; do not propose a new encoding sweep.
2. For each of the three buttonhole marks, compare its source point with the
   complete returned glyph/geometry. Establish whether the 1.4999984 cm is a
   true misplaced mark or a center-to-outline measurement artifact. If a
   comparator defect is proven, implement a candidate-only correction with
   precise tests and preserve the mark identity, units and legacy export. If
   not proven, do not mask the miss.
3. Reconcile the immutable V03 profile/rights and all-seven requirements from
   current packets. A local geometric correction cannot be represented as an
   industrial-profile pass. Do not broaden scope or change acceptance.
4. No UI operation, software install, receiver variation, export setting
   variation or format variation. Keep all actual or derived DXF files on C:.
5. Run focused tests and changed-code 100% statement/branch/function/line
   coverage if production comparison code changes; run no full repo gate here.

## Fixed scope and non-goals

Keep all-seven recipes and supported grades/options, 0.001 cm thresholds,
identity/mark/layer, malformed-input, repeatability, readable output,
rights/profile and round-trip gates unchanged. Preserve `exportDxf` behavior
and every protected byte identity. Do not change pattern geometry, app
selection, standards claims, physical-fit/factory claims, or unrelated UI.
Cleanup is recorded for the final PR boundary only.

## Exit timing

At slice exit, record implementation, focused verification, external wait,
maintainer decision and durable closeout time separately. No safe disjoint
delegation is planned: exact entity parsing, comparator semantics and its
tests require the same evidence and code ownership.
