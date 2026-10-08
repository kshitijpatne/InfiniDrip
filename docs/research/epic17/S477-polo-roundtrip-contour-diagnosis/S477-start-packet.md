# EPIC-17 / G04 V03 Polo contour diagnosis — Slice 477 start

## Verified start and goal

- Started `2026-10-08 06:52:52 UTC` from S476 commit
  `04aa3d2c111aa1a9554b7f79c12e7246f534abf3` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
  ancestor. Worktree was clean before reserving S477. S476 is the highest
  assigned slice; S477 is reserved. Board revision 2943 records S476's start
  and exit. EPIC-17 and G04-V03 remain In Progress; V01/V02 Done.
- The thread goal is active and still matches the admitted EPIC-17 objective.
  It does not need a UI resume or wording/status reconciliation.
- Ordinary usage remains available (13% of primary, 33% weekly at start).

## Scope

Diagnose the five Polo M source CUT contours not proven by S476's actual CLO
DXF export using source-piece order and the saved C:-only source/output files.
The receiver-independent S463 manifest gives the piece order:
`front`, `back`, `sleeve`, `button placket`, `buttonhole placket`, `outer
collar stand`, `inner collar stand`, `upper pointed collar`, `under pointed
collar`; each contributes one CUT then one SEW contour. S476 identified CUT
contours at source ordinals 2, 10, 12, 14, and 16 as unresolved; these map by
manifest order to `back`, `outer collar stand`, `inner collar stand`, `upper
pointed collar`, and `under pointed collar`.

Inspect the exact source revision/hash, raw DXF entity order, block INSERT
transforms, all numeric-layer polylines, closure, vertex counts/bulges, and
source CUT/SEW correspondence for these pieces. Determine whether the apparent
mismatch is a true geometric change, a missing/source-to-output association,
or a representation change (for example, curved-entity serialization). Create
annotated overlays from the actual source and receiver output only under
`C:\G04-CLO-DXF-Exchange\Evidence`, with source piece/edge identities and
measured differences visible. Keep CLO open.

## Acceptance and non-goals

1. Reconfirm input/export hashes and S476's exact 13/18 result from the saved
   source and output; do not rely on prior prose alone.
2. Attribute each of the five contours to its source piece and exact output
   block/entity/layer candidates. Compare source CUT to source SEW and every
   receiver candidate; identify any coordinate transform or vertex/bulge
   conversion instead of silently treating different representations as
   equal.
3. Produce source/output overlays and a durable, fully bounded diagnosis in
   this packet. Distinguish proven facts from interpretation; explicitly state
   if exact unit/standard semantics remain unknowable.
4. Do not alter pattern geometry, stitch topology, the DXF exporter, output
   settings, product code, export identities, standards claims, V02/V03 gates,
   or compatibility claims. Do not mark Polo's receiver trial as passing.
5. No target-receiver upload, paid software, supplier/factory contact,
   physical sampling, fit claim, or production-readiness claim.

## Verification and delegation

This is a read-only geometry investigation. Use a focused parser/geometry
diagnostic that checks the hash-bound C: files and reports exact identities;
inspect the generated overlays visually. `git diff --check` and the focused
evidence-script run apply. No repository-wide tests, builds, or coverage gate
are applicable unless production code changes (none are in scope); preserve the
full Epic gate for the settled candidate.

One independent low-risk OpenCode review is delegated to check the S463 source
fixture's piece/entity ordering and whether the S476 cyclic-vertex matcher
could confuse source CUT/SEW roles. It receives no CLO output file and owns no
product files; its precise handoff is `S477-opencode-review-handoff.md`. Use
only `opencode/muse-spark-1.3-contributor-free` at `xhigh`, normal mode. Wait
for the exact `WORK FINISHED` signal before reviewing. If that exact setup is
unavailable, stop and report; do not substitute a model. Codex owns the
geometry diagnosis, overlays, integrated review, records, and merge.

## Blockers and next action

Known blocker: five source CUT contours fail or cannot be paired under the
current exact-vertex metric; no source change is approved. There are no
maintainer decisions pending for this slice. Next: perform the read-only
piece-specific source/output diagnosis and inspect its overlays. If evidence
shows CLO actually alters or omits geometry, retain V03 holds and report the
exact defect; do not propose a source or exporter fix in this diagnostic
slice.
