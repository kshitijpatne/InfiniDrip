# EPIC-17 / G04 V03 — Woven button-circle ARC trial — Slice 637 start

## Verified boundary and authority

- Reserved S637 on 2026-10-09 after S636 commit
  `04c37f4da6e4acde7add2638c63643361686c5d9` on
  `codex/epic-17-g04`. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. S636 is
  the highest assigned slice; no S637 subject exists in inspected Git
  history. The worktree was clean before this packet/context-index update.
- Canonical board revision 3688 records V01/V02 Done and V03/EPIC-17 In
  Progress. Validated start replay will add S637 evidence/comment only and
  preserve all work-item statuses and V03 holds.
- User-authorized CLO product-development and local-file processing apply to
  this test. CLO 2026.1.310 (r58944) is already open; keep the existing app
  session open. Confine all test DXF, project, query and renders to
  `C:\G04-CLO-DXF-Exchange\S637-woven-circle-arc-trial\`.

## Evidence-led question

S629 audited a hash-pinned CLO DXF-AAMA Woven exchange. Eight source
`MARK_BUTTON` CIRCLEs became closed 12-vertex POLYLINE approximations. The
maximum whole-curve sagitta is `0.005113 cm`, above the unchanged `0.001 cm`
gate, although their vertices lie close to the source radius. This is a
measured receiver-side geometric failure, not a readability pass. The
hash-pinned source is
`C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Input\woven-zero-vent-named-piece-blocks.dxf`
(17,039 bytes; SHA-256
`DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6`).

S637 tests one coordinate-preserving alternative entity representation:
replace only each of the eight source CIRCLE entities by four exact
90-degree ARC entities with the same center, radius, layer and full circular
locus. Preserve every other entity, block, coordinate, unit, identity,
layer, source pattern and option byte-for-byte at the parsed entity level.
Import that one derived fixture in the already documented CLO DXF-AAMA mode,
using the S628 recorded settings. Query native pattern/mark geometry and save
an actual detailed render. This tests CLO's handling of a distinct DXF entity
encoding; it does not assert that four ARCs have button semantics in an
industrial profile.

Official CLO documentation lists DXF-AAMA/ASTM and describes “optimize all
curve points,” but does not promise circle/arc import fidelity or mark-role
mapping: https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export .
Therefore the ARC trial is a bounded practical measurement, not a sourced
compatibility claim. Product-use and local processing authorization is
settled; rights to a named industrial apparel standard/profile remain an
independent V03 gate.

## Method and fail-closed rule

1. Verify the S628 source hash and create the disposable S637 folder/input on
   C:. Transform only the eight named CIRCLEs, and assert: eight source
   circles become exactly 32 same-layer quarter ARCs; each reconstructed
   circular locus is identical at machine precision; every non-target entity
   and all CUT/SEW contours remain unchanged. Hash-pin source and derivative.
2. Use the existing CLO instance and a clean project. Import the S637
   derivative once via DXF-AAMA with centimeters, 100%, no rotation, original
   grain, curve points retained, import notches to both/ratio as available,
   and no annotation, swap, auto-trace, distribution, curve optimization or
   removal of non-grading points. Record live settings, notices and errors.
3. Save a native project and read-only native query under the named C: folder.
   Bind every imported mark to its source pattern/block and center/radius;
   measure full-circle geometric deviation at `0.001 cm` and inspect detailed
   actual rendered output for missing, split, merged, clipped or unreadable
   marks. Preserve the S629 baseline for source CIRCLE input.
4. Any missing identity, changed CUT/SEW contour, absent/ambiguous mark,
   full-circle deviation above `0.001 cm`, API/import error, or render defect
   fails the trial and stops before export. Do not vary import settings or
   alter source/profile semantics to rescue the result.
5. Export/reimport is permitted only if all applicable contours and every
   required mark pass the existing pre-export gates. Otherwise record the
   specific measured blocker, retain all V03 holds and stop without export.

## Scope, non-goals, and gates

- Research-only disposable fixture. No production source, garment pattern,
  cut/stitch geometry, POM, mark definition, layer meaning, DXF writer,
  baseline, threshold, acceptance, status or hold changes.
- This single Woven size-M case cannot qualify an apparel profile, clear
  rights/conformance, all-seven recipes/options/grades, stable identity,
  units, invalid-input safety, repeated round trips, readable outputs across
  the cohort, or V03. It does not address V02 holds, G05, G09, physical fit,
  supplier/factory acceptance, launch spending, or production readiness.
- Focused checks: derivative/entity-locus assertions, CLO query/source-bound
  comparison, actual rendered detail inspection, helper syntax and hashes,
  `npm run control-center:test`, validated board replay, and `git diff --check`.
  No production code changes; production coverage is not applicable. Keep the
  full repository coverage/build/browser/output gate for the settled Epic/PR.
- No safe delegated task has disjoint ownership from this one live CLO import
  and source-bound query; Codex owns the experiment and integrated review.

## Exit record to complete

At S637 close, record the exact receiver behavior, native geometry and visual
result, export/round-trip disposition, hashes, focused verification, board
revisions and separate elapsed implementation, focused-verification,
external-agent-wait and maintainer-decision times. Keep V03/EPIC-17 In Progress
and all V03 holds unchanged. If ARC representation fails, next choose a
different open V03 gate/receiver based on the resulting evidence; do not repeat
this entity encoding or the completed CLO CUT matrix.
